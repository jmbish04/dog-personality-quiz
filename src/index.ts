import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { quizRouter } from './routes/quiz';
import { resultsRouter } from './routes/results';
import { staticRouter } from './routes/static';
import { ensurePlaceholdersExist } from './utils/placeholders';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: any;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:8787', 'https://*.workers.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize placeholders on first request
let placeholdersInitialized = false;

app.use('*', async (c, next) => {
  if (!placeholdersInitialized && c.env?.BUCKET) {
    try {
      await ensurePlaceholdersExist(c.env.BUCKET);
      placeholdersInitialized = true;
      console.log('Placeholder images initialized');
    } catch (error) {
      console.error('Error initializing placeholder images:', error);
      // Continue anyway - the app should still work with fallbacks
    }
  }
  await next();
});

// Routes
app.route('/api/quiz', quizRouter);
app.route('/api/results', resultsRouter);
app.route('/', staticRouter);


export default app;