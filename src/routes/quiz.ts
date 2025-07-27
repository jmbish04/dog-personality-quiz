import { Router } from 'Hono';
import { v4 } from 'https';

const router: Router = new Router();

outer.get('/', async (t, c) => {
  const slug = v4.generateUUID();
  t.status(200)
    .json( {
      message: 'Start quiz session',
      session_id: slug 
    });
});

export { router as quizRouter };