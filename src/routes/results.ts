import { Hono } from 'hono';
import { Env } from '../index';
import { calculateTraitScores } from '../utils/scoring';
import { generateTraitImages } from '../utils/images';
import { generatePersonalityTitle } from '../utils/personality';

const resultsRouter = new Hono<{ Bindings: Env }>();

// Generate and get quiz results
resultsRouter.post('/:slug/generate', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Get session data
    const session = await c.env.DB.prepare(`
      SELECT s.*
      FROM sessions s
      WHERE s.slug = ?
    `).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Get questions and answers for this session
    const qaData = await c.env.DB.prepare(`
      SELECT q.text as question, a.selected_option as answer
      FROM questions q
      JOIN answers a ON q.id = a.question_id
      WHERE q.session_id = ?
      ORDER BY q.order_index
    `).bind(session.id).all();

    // Check if results already exist
    const existingResults = await c.env.DB.prepare(
      'SELECT * FROM results WHERE session_id = ?'
    ).bind(session.id).first();

    if (existingResults) {
      return c.json({
        success: true,
        results: {
          id: existingResults.id,
          title: existingResults.title,
          summary: existingResults.summary,
          scores: JSON.parse(existingResults.scores as string),
          generated_images: JSON.parse(existingResults.generated_images as string || '{}'),
          created_at: existingResults.created_at
        }
      });
    }

    // Parse Q&A pairs from structured data
    const qaPairs = qaData.results.map((row: any) => ({
      question: row.question,
      answer: row.answer
    }));

    // Calculate trait scores
    const scores = calculateTraitScores(qaPairs);
    
    // Generate personality title
    const title = await generatePersonalityTitle(c.env.AI, session as any, scores);
    
    // Generate trait images
    const generatedImages = await generateTraitImages(c.env.AI, c.env.BUCKET, session as any, scores);
    
    // Save results
    const result = await c.env.DB.prepare(
      'INSERT INTO results (session_id, title, summary, scores, generated_images) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      session.id,
      title,
      `${session.dog_name} has completed the personality quiz!`,
      JSON.stringify(scores),
      JSON.stringify(generatedImages)
    ).run();

    if (!result.success) {
      throw new Error('Failed to save results');
    }

    return c.json({
      success: true,
      results: {
        id: result.meta?.last_row_id,
        title,
        summary: `${session.dog_name} has completed the personality quiz!`,
        scores,
        generated_images: generatedImages,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating results:', error);
    return c.json({ error: 'Failed to generate results' }, 500);
  }
});

// Get quiz results
resultsRouter.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Get session and results
    const sessionData = await c.env.DB.prepare(`
      SELECT s.*, r.*
      FROM sessions s
      LEFT JOIN results r ON s.id = r.session_id
      WHERE s.slug = ?
    `).bind(slug).first();

    if (!sessionData) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    if (!sessionData.title) {
      return c.json({ error: 'Results not generated yet. Please complete the quiz first.' }, 404);
    }

    // Get questions and answers for this session
    const qaData = await c.env.DB.prepare(`
      SELECT q.text as question, a.selected_option as answer
      FROM questions q
      JOIN answers a ON q.id = a.question_id
      WHERE q.session_id = ?
      ORDER BY q.order_index
    `).bind(sessionData.id).all();

    // Parse Q&A pairs from structured data
    const qaPairs = qaData.results.map((row: any) => ({
      question: row.question,
      answer: row.answer
    }));

    return c.json({
      success: true,
      session: {
        slug: sessionData.slug,
        dog_name: sessionData.dog_name,
        breed: sessionData.breed,
        age: sessionData.age,
        gender: sessionData.gender,
        photo_url: sessionData.photo_url
      },
      results: {
        title: sessionData.title,
        summary: sessionData.summary,
        scores: JSON.parse(sessionData.scores as string),
        generated_images: JSON.parse(sessionData.generated_images as string || '{}'),
        created_at: sessionData.created_at
      },
      qa_pairs: qaPairs
    });
  } catch (error) {
    console.error('Error getting results:', error);
    return c.json({ error: 'Failed to get results' }, 500);
  }
});

// Regenerate trait image
resultsRouter.post('/:slug/regenerate-image/:trait', async (c) => {
  try {
    const slug = c.req.param('slug');
    const trait = c.req.param('trait');
    
    // Get session and results
    const sessionData = await c.env.DB.prepare(`
      SELECT s.*, r.scores
      FROM sessions s
      JOIN results r ON s.id = r.session_id
      WHERE s.slug = ?
    `).bind(slug).first();

    if (!sessionData) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    const scores = JSON.parse(sessionData.scores as string);
    
    if (!scores[trait]) {
      return c.json({ error: 'Invalid trait' }, 400);
    }

    // Generate new image for this trait
    const newImages = await generateTraitImages(c.env.AI, c.env.BUCKET, sessionData as any, { [trait]: scores[trait] });
    
    // Update results with new image
    const currentResults = await c.env.DB.prepare(
      'SELECT generated_images FROM results WHERE session_id = ?'
    ).bind(sessionData.id).first();

    const currentImages = JSON.parse(currentResults?.generated_images as string || '{}');
    const updatedImages = { ...currentImages, ...newImages };

    await c.env.DB.prepare(
      'UPDATE results SET generated_images = ? WHERE session_id = ?'
    ).bind(JSON.stringify(updatedImages), sessionData.id).run();

    return c.json({
      success: true,
      new_image: newImages[trait],
      message: `New ${trait} image generated`
    });
  } catch (error) {
    console.error('Error regenerating image:', error);
    return c.json({ error: 'Failed to regenerate image' }, 500);
  }
});

// Chat about results
resultsRouter.post('/:slug/chat', async (c) => {
  try {
    const slug = c.req.param('slug');
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get session and results
    const sessionData = await c.env.DB.prepare(`
      SELECT s.*, r.scores, r.title
      FROM sessions s
      JOIN results r ON s.id = r.session_id
      WHERE s.slug = ?
    `).bind(slug).first();

    if (!sessionData) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    const scores = JSON.parse(sessionData.scores as string);
    
    // Generate AI response about the dog's personality
    const chatPrompt = `You are a dog personality expert. Based on the personality analysis for ${sessionData.dog_name} (${sessionData.breed || 'mixed breed'}), answer this question: "${message}"

Dog's personality profile:
- Overall title: ${sessionData.title}
- Traits: ${Object.entries(scores).map(([trait, data]: [string, any]) => 
  `${trait}: ${data.label} - ${data.description}`).join(', ')}

Respond in a friendly, expert tone as if you're a professional dog behaviorist. Keep it engaging and insightful.`;

    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: chatPrompt }]
    });

    return c.json({
      success: true,
      response: response.response || 'I\'d be happy to tell you more about your dog\'s personality! Could you ask me something specific?'
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return c.json({ error: 'Failed to process chat message' }, 500);
  }
});

export { resultsRouter };