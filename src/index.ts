import { Hono } from 'hono';
import { quizRouter } from './routes/quiz';
import { resultRouter } from './routes/results';

const app = new Hono();

app.route('/quiz', quizRouter);
app.route('/results', resultRouter);

export default app;