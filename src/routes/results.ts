import { Hono } from 'hono';
import { Env } from '../index';
import { calculateTraitScores } from '../utils/scoring';
import { generateTraitImages } from '../utils/images';
import { generatePersonalityTitle } from '../utils/personality';

// This router handles all result-related endpoints.
// It's initialized with Hono and bindings for the Cloudflare environment (Env).
const resultsRouter = new Hono<{ Bindings: Env }>();

/**
 * @route POST /:slug/generate
 * @description Generates the quiz results for a given session.
 * It calculates trait scores, generates a personality title and images using AI,
 * and saves the results to the database. If results already exist, it returns them.
 */
resultsRouter.post('/:slug/generate', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Fetch session data and all associated question-answer pairs.
    const session = await c.env.DB.prepare(`
      SELECT s.*, 
        GROUP_CONCAT(q.text || ':::' || a.selected_option, '|||') as qa_pairs
      FROM sessions s
      LEFT JOIN questions q ON s.id = q.session_id
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE s.slug = ?
      GROUP BY s.id
    `).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Check if results have already been generated to prevent re-computation.
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

    // Parse the concatenated Q&A pairs from the database query.
    const qaPairs = (session as any).qa_pairs ? 
      (session as any).qa_pairs.split('|||').map((pair: string) => {
        const [question, answer] = pair.split(':::');
        return { question, answer };
      }).filter((pair: any) => pair.question && pair.answer) : [];

    // Calculate personality trait scores based on answers.
    const scores = calculateTraitScores(qaPairs);
    
    // Generate a catchy personality title using Cloudflare AI.
    const title = await generatePersonalityTitle(c.env.AI, session as any, scores);
    
    // Generate unique images for each personality trait using AI and store them in R2.
    const generatedImages = await generateTraitImages(c.env.AI, c.env.BUCKET, session as any, scores);
    
    // Save the newly generated results to the database.
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
      throw new Error('Failed to save results to the database');
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

/**
 * @route GET /:slug
 * @description Retrieves the generated results for a specific quiz session.
 */
resultsRouter.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Fetch session and result data in a single query.
    const sessionData = await c.env.DB.prepare(`
      SELECT s.*, r.*,
        GROUP_CONCAT(q.text || ':::' || a.selected_option, '|||') as qa_pairs
      FROM sessions s
      LEFT JOIN results r ON s.id = r.session_id
      LEFT JOIN questions q ON s.id = q.session_id
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE s.slug = ?
      GROUP BY s.id, r.id
    `).bind(slug).first();

    if (!sessionData) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    if (!sessionData.title) {
      return c.json({ error: 'Results not generated yet. Please complete the quiz first.' }, 404);
    }

    const qaPairs = (sessionData as any).qa_pairs ? 
      (sessionData as any).qa_pairs.split('|||').map((pair: string) => {
        const [question, answer] = pair.split(':::');
        return { question, answer };
      }).filter((pair: any) => pair.question && pair.answer) : [];

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

/**
 * @route POST /:slug/regenerate-image/:trait
 * @description Regenerates an AI image for a specific personality trait.
 */
resultsRouter.post('/:slug/regenerate-image/:trait', async (c) => {
  try {
    const slug = c.req.param('slug');
    const trait = c.req.param('trait');
    
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
      return c.json({ error: 'Invalid trait specified' }, 400);
    }

    // Generate a new image only for the specified trait.
    const newImages = await generateTraitImages(c.env.AI, c.env.BUCKET, sessionData as any, { [trait]: scores[trait] });
    
    // Update the results JSON with the new image URL.
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
      message: `New image for ${trait} has been generated.`
    });
  } catch (error) {
    console.error('Error regenerating image:', error);
    return c.json({ error: 'Failed to regenerate image' }, 500);
  }
});

/**
 * @route POST /:slug/chat
 * @description Provides an AI-powered chat to discuss the dog's personality results.
 */
resultsRouter.post('/:slug/chat', async (c) => {
  try {
    const slug = c.req.param('slug');
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'A chat message is required' }, 400);
    }

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
    
    // Construct a detailed prompt for the AI model.
    const chatPrompt = `You are a dog personality expert. Based on the personality analysis for ${sessionData.dog_name} (${sessionData.breed || 'mixed breed'}), answer this question: "${message}"

Dog's personality profile:
- Overall title: ${sessionData.title}
- Traits: ${Object.entries(scores).map(([trait, data]: [string, any]) => 
  `${trait}: ${data.label} - ${data.description}`).join(', ')}

Respond in a friendly, expert tone as if you're a professional dog behaviorist. Keep it engaging and insightful.`;

    // Run the chat completion with the Llama 3.1 model.
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: chatPrompt }]
    });

    return c.json({
      success: true,
      response: response.response || 'I would be happy to tell you more about your dog\'s personality! Could you ask me something specific?'
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return c.json({ error: 'Failed to process chat message' }, 500);
  }
});

export { resultsRouter };
