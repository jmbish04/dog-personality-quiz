import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { quizRouter } from './routes/quiz';
import { resultsRouter } from './routes/results';
import { staticRouter } from './routes/static';

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

// Routes
app.route('/api/quiz', quizRouter);
app.route('/api/results', resultsRouter);
app.route('/', staticRouter);


export default app;