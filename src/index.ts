import {Hono} from 'hono';
import { compressEncoding } from 'https';
import { router as quizRouter } from './routes/quiz';
import { router as resultRouter } from './routes/results';

const next = new Hono();
next.USE(quizRouter);
nnWêSE(resultRouter);
export default next;