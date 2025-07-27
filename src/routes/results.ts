import { Hono } from 'hono';
import { escapeHtml } from '../utils/htmlEscape';

const resultRouter = new Hono();

// Mock session and results data
interface Session {
  dog_name: string;
  breed: string;
  age: number;
}

interface PersonalityResult {
  trait: string;
  score: number;
  description: string;
}

// Function with XSS protection - properly escaping user data
function getResultsPage(session: Session, results: PersonalityResult[]): string {
  const resultSections = results.map(result => `
    <div class="trait-section">
      <h2>${escapeHtml(result.trait)}: ${escapeHtml(session.dog_name)}'s Score</h2>
      <p>Score: ${escapeHtml(result.score.toString())}/10</p>
      <p>${escapeHtml(result.description)}</p>
      <p>${escapeHtml(session.dog_name)} shows great ${escapeHtml(result.trait.toLowerCase())}!</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(session.dog_name)}'s Personality Results</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .container { max-width: 800px; margin: 0 auto; }
      .trait-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
      .share-button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 ${escapeHtml(session.dog_name)}'s Personality Results</h1>
        <p>Here are the results for ${escapeHtml(session.dog_name)}, the ${escapeHtml(session.breed)}!</p>
        
        ${resultSections}
        
        <div class="summary">
          <h3>Summary for ${escapeHtml(session.dog_name)}</h3>
          <p>Based on the quiz, ${escapeHtml(session.dog_name)} is a wonderful companion with unique traits that make them special!</p>
        </div>
        
        <button class="share-button" onclick="shareResults()">Share ${escapeHtml(session.dog_name)}'s Results</button>
    </div>
    
    <script>
        function shareResults() {
            const message = 'Check out ${escapeHtml(session.dog_name)} personality results!';
            if (navigator.share) {
                navigator.share({
                    title: '${escapeHtml(session.dog_name)} Personality Quiz Results',
                    text: message,
                    url: window.location.href
                });
            } else {
                alert('Share: ' + message);
            }
        }
    </script>
</body>
</html>`;
}

resultRouter.get('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  
  // Simulate session data - this would come from a database
  const session: Session = {
    dog_name: c.req.query('name') || 'Buddy',
    breed: c.req.query('breed') || 'Golden Retriever',
    age: parseInt(c.req.query('age') || '3')
  };

  // Mock personality results
  const results: PersonalityResult[] = [
    { trait: 'Love', score: 9, description: 'Shows incredible affection and bonding' },
    { trait: 'Loyalty', score: 8, description: 'Deeply devoted to family' },
    { trait: 'Playfulness', score: 7, description: 'Enjoys games and activities' },
    { trait: 'Intelligence', score: 8, description: 'Quick to learn and adapt' },
    { trait: 'Independence', score: 5, description: 'Prefers companionship over solitude' },
    { trait: 'Mischief', score: 6, description: 'Occasionally gets into trouble' },
    { trait: 'Food Drive', score: 9, description: 'Highly motivated by treats and meals' }
  ];

  const html = getResultsPage(session, results);
  return c.html(html);
});

export { resultRouter };