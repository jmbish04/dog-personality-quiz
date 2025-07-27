import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { Env } from '../index';
import { getHomePage, getQuizPage, getResultsPage } from '../templates/pages';
import { getDataURIPlaceholder } from '../utils/placeholders';

const staticRouter = new Hono<{ Bindings: Env }>();

// Home page
staticRouter.get('/', async (c) => {
  return c.html(getHomePage());
});

// Quiz page
staticRouter.get('/quiz/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  // Verify session exists
  const session = await c.env.DB.prepare(
    'SELECT * FROM sessions WHERE slug = ?'
  ).bind(slug).first();

  if (!session) {
    return c.html('<h1>Quiz session not found</h1><a href="/">Start a new quiz</a>', 404);
  }

  return c.html(getQuizPage(slug, session as any));
});

// Results page
staticRouter.get('/results/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  // Get session and results data
  const sessionData = await c.env.DB.prepare(`
    SELECT s.*, r.*
    FROM sessions s
    LEFT JOIN results r ON s.id = r.session_id
    WHERE s.slug = ?
  `).bind(slug).first();

  if (!sessionData) {
    return c.html('<h1>Quiz session not found</h1><a href="/">Start a new quiz</a>', 404);
  }

  if (!sessionData.title) {
    return c.html('<h1>Results not ready</h1><p>Please complete the quiz first.</p><a href="/quiz/' + slug + '">Continue Quiz</a>', 404);
  }

  return c.html(getResultsPage(slug, sessionData as any));
});

// Serve images from R2 - catch all nested paths
staticRouter.get('/images/:path{.*}', async (c) => {
  try {
    const key = c.req.param('path');
    
    if (!key) {
      return c.notFound();
    }
    
    const object = await c.env.BUCKET.get(key);
    
    if (!object) {
      // If it's a placeholder request, try to create a data URI fallback
      if (key.startsWith('placeholders/')) {
        const trait = key.replace('placeholders/', '').replace(/\.(png|svg)$/, '');
        
        // Return a simple SVG response
        const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#E0E0E0" rx="100"/>
          <text x="100" y="120" font-family="Arial" font-size="40" text-anchor="middle" fill="#333">🐶</text>
          <text x="100" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">Dog</text>
        </svg>`;
        
        return new Response(svgContent, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
      
      return c.notFound();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving image:', error);
    return c.notFound();
  }
});

export { staticRouter };