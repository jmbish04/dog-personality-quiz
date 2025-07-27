import { Hono } from 'hono';
import { Env } from '../index';
import { generateSlug } from '../utils/slug';
import { getStandardQuestions, generateAIQuestions } from '../utils/questions';

// This router is initialized with Hono and bindings for the Cloudflare environment (Env),
// allowing access to services like D1, R2, and AI.
const quizRouter = new Hono<{ Bindings: Env }>();

/**
 * @route POST /start
 * @description Starts a new quiz session.
 * Expects a JSON body with dog_name, breed, age, and gender.
 * Creates a new session in the database and returns a unique session slug.
 */
quizRouter.post('/start', async (c) => {
  try {
    const { dog_name, breed, age, gender } = await c.req.json();
    
    if (!dog_name) {
      return c.json({ error: 'Dog name is required' }, 400);
    }

    const slug = generateSlug();
    
    // Insert the new session into the D1 database.
    const result = await c.env.DB.prepare(
      'INSERT INTO sessions (slug, dog_name, breed, age, gender) VALUES (?, ?, ?, ?, ?)'
    ).bind(slug, dog_name, breed || null, age || null, gender || null).run();

    if (!result.success) {
      throw new Error('Failed to create session in database');
    }

    return c.json({
      success: true,
      session_id: slug,
      message: 'Quiz session started successfully'
    });
  } catch (error) {
    console.error('Error starting quiz session:', error);
    return c.json({ error: 'Failed to start quiz session' }, 500);
  }
});

/**
 * @route GET /:slug/questions
 * @description Retrieves questions for a given quiz session.
 * If questions don't exist, it generates and saves standard questions.
 * It can also generate additional questions using Cloudflare AI based on previous answers.
 */
quizRouter.get('/:slug/questions', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Fetch the session from the database.
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE slug = ?'
    ).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Check if questions have already been generated for this session.
    const existingQuestions = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE session_id = ? ORDER BY order_index'
    ).bind(session.id).all();

    if (existingQuestions.results && existingQuestions.results.length > 0) {
      return c.json({
        success: true,
        questions: existingQuestions.results.map(q => ({
          id: q.id,
          text: q.text,
          options: JSON.parse(q.options as string),
          order_index: q.order_index
        }))
      });
    }

    // Generate and insert standard questions if none exist.
    const standardQuestions = getStandardQuestions();
    const standardQuestionStmts = standardQuestions.map((question, i) => 
      c.env.DB.prepare('INSERT INTO questions (session_id, text, options, order_index) VALUES (?, ?, ?, ?)')
        .bind(session.id, question.text, JSON.stringify(question.options), i + 1)
    );
    await c.env.DB.batch(standardQuestionStmts);

    // Note: The logic for generating AI questions is preserved but may need answers to be submitted first.
    // This part of the code could be moved to a separate endpoint or triggered after a certain number of answers.
    const answers = await c.env.DB.prepare(`
      SELECT q.text, a.selected_option 
      FROM answers a 
      JOIN questions q ON a.question_id = q.id 
      WHERE q.session_id = ?
    `).bind(session.id).all();

    if (answers.results && answers.results.length > 5) {
      const aiQuestions = await generateAIQuestions(c.env.AI, answers.results as any[], session as any);
      
      const aiQuestionStmts = aiQuestions.map((question, i) => 
        c.env.DB.prepare('INSERT INTO questions (session_id, text, options, order_index) VALUES (?, ?, ?, ?)')
          .bind(session.id, question.text, JSON.stringify(question.options), standardQuestions.length + i + 1)
      );
      await c.env.DB.batch(aiQuestionStmts);
    }

    // Fetch and return all questions for the session.
    const allQuestions = await c.env.DB.prepare(
      'SELECT * FROM questions WHERE session_id = ? ORDER BY order_index'
    ).bind(session.id).all();

    return c.json({
      success: true,
      questions: allQuestions.results?.map(q => ({
        id: q.id,
        text: q.text,
        options: JSON.parse(q.options as string),
        order_index: q.order_index
      })) || []
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return c.json({ error: 'Failed to get questions' }, 500);
  }
});

/**
 * @route POST /:slug/answer
 * @description Submits an answer for a specific question in a session.
 * It updates an existing answer or creates a new one (upsert logic).
 */
quizRouter.post('/:slug/answer', async (c) => {
  try {
    const slug = c.req.param('slug');
    const { question_id, selected_option } = await c.req.json();
    
    if (!question_id || !selected_option) {
      return c.json({ error: 'Question ID and selected option are required' }, 400);
    }

    // Verify the question belongs to the specified session to ensure data integrity.
    const question = await c.env.DB.prepare(`
      SELECT q.*, s.id as session_id 
      FROM questions q 
      JOIN sessions s ON q.session_id = s.id 
      WHERE q.id = ? AND s.slug = ?
    `).bind(question_id, slug).first();

    if (!question) {
      return c.json({ error: 'Question not found for this session' }, 404);
    }

    // Check if an answer for this question already exists.
    const existingAnswer = await c.env.DB.prepare(
      'SELECT * FROM answers WHERE question_id = ?'
    ).bind(question_id).first();

    if (existingAnswer) {
      // Update the existing answer.
      await c.env.DB.prepare(
        'UPDATE answers SET selected_option = ? WHERE question_id = ?'
      ).bind(selected_option, question_id).run();
    } else {
      // Insert a new answer.
      await c.env.DB.prepare(
        'INSERT INTO answers (question_id, selected_option) VALUES (?, ?)'
      ).bind(question_id, selected_option).run();
    }

    return c.json({ success: true, message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Error saving answer:', error);
    return c.json({ error: 'Failed to save answer' }, 500);
  }
});

/**
 * @route POST /:slug/photo
 * @description Uploads a photo for the quiz session.
 * The photo is sent as form-data and stored in an R2 bucket.
 * The photo's key is then saved in the session's database record.
 */
quizRouter.post('/:slug/photo', async (c) => {
  try {
    const slug = c.req.param('slug');
    const formData = await c.req.formData();
    const photo = formData.get('photo');
    
    if (!photo || typeof photo === 'string') {
      return c.json({ error: 'A valid photo file is required' }, 400);
    }

    const photoFile = photo as File;

    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE slug = ?'
    ).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Generate a unique key for the photo in R2 storage.
    const photoKey = `photos/${slug}-${Date.now()}.jpg`;
    
    // Upload the photo stream to the R2 bucket.
    await c.env.BUCKET.put(photoKey, photoFile.stream(), {
      httpMetadata: {
        contentType: photoFile.type
      }
    });

    // Update the session record with the R2 photo key.
    await c.env.DB.prepare(
      'UPDATE sessions SET photo_url = ? WHERE slug = ?'
    ).bind(photoKey, slug).run();

    return c.json({ 
      success: true, 
      photo_url: photoKey,
      message: 'Photo uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({ error: 'Failed to upload photo' }, 500);
  }
});

export { quizRouter };
