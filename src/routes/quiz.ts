import { Hono } from 'hono';
import { escapeHtml } from '../utils/htmlEscape';

const quizRouter = new Hono();

// Mock session data for demonstration
interface Session {
  dog_name: string;
  breed: string;
  age: number;
}

// Function with XSS protection - properly escaping user data
function getHomePage(session: Session): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Dog Personality Quiz</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div class="container">
        <h1>🐶 ${escapeHtml(session.dog_name)}'s Personality Quiz</h1>
        <p>Welcome back! Let's continue ${escapeHtml(session.dog_name)}'s personality assessment.</p>
        <p>Breed: ${escapeHtml(session.breed)}</p>
        <p>Age: ${escapeHtml(session.age.toString())} years old</p>
        <button onclick="startQuiz()">Continue Quiz</button>
    </div>
    <script>
        function startQuiz() {
            alert('Starting quiz for ${escapeHtml(session.dog_name)}!');
        }
    </script>
</body>
</html>`;
}

quizRouter.get('/', async (c) => {
  // Simulate session data - this would come from a database
  const session: Session = {
    dog_name: c.req.query('name') || 'Buddy',
    breed: c.req.query('breed') || 'Golden Retriever', 
    age: parseInt(c.req.query('age') || '3')
  };

  const html = getHomePage(session);
  return c.html(html);
});

quizRouter.get('/start', async (c) => {
  return c.json({
    message: 'Start quiz session',
    session_id: crypto.randomUUID()
  });
});

export { quizRouter };