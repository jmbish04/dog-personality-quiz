import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { Env } from '../index';
import { getHomePage, getQuizPage, getResultsPage } from '../templates/pages';

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

// Serve images from R2
staticRouter.get('/images/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const object = await c.env.BUCKET.get(key);
    
    if (!object) {
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