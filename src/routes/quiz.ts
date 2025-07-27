import { Hono } from 'hono';
import { Env } from '../index';
import { generateSlug } from '../utils/slug';
import { getStandardQuestions, generateAIQuestions } from '../utils/questions';

const quizRouter = new Hono<{ Bindings: Env }>();

// Start a new quiz session
quizRouter.post('/start', async (c) => {
  try {
    const { dog_name, breed, age, gender } = await c.req.json();
    
    if (!dog_name) {
      return c.json({ error: 'Dog name is required' }, 400);
    }

    const slug = generateSlug();
    
    // Insert new session
    const result = await c.env.DB.prepare(
      'INSERT INTO sessions (slug, dog_name, breed, age, gender) VALUES (?, ?, ?, ?, ?)'
    ).bind(slug, dog_name, breed || null, age || null, gender || null).run();

    if (!result.success) {
      throw new Error('Failed to create session');
    }

    return c.json({
      success: true,
      session_id: slug,
      message: 'Quiz session started'
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return c.json({ error: 'Failed to start quiz session' }, 500);
  }
});

// Get quiz questions
quizRouter.get('/:slug/questions', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Get session
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE slug = ?'
    ).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Check if questions already exist
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

    // Generate standard questions
    const standardQuestions = getStandardQuestions();
    
    // Insert standard questions
    for (let i = 0; i < standardQuestions.length; i++) {
      const question = standardQuestions[i];
      await c.env.DB.prepare(
        'INSERT INTO questions (session_id, text, options, order_index) VALUES (?, ?, ?, ?)'
      ).bind(session.id, question.text, JSON.stringify(question.options), i + 1).run();
    }

    // Get previous answers for AI question generation
    const answers = await c.env.DB.prepare(`
      SELECT q.text, a.selected_option 
      FROM answers a 
      JOIN questions q ON a.question_id = q.id 
      WHERE q.session_id = ?
    `).bind(session.id).all();

    // Generate AI questions if we have some answers
    if (answers.results && answers.results.length > 5) {
      const aiQuestions = await generateAIQuestions(c.env.AI, answers.results as any[], session as any);
      
      // Insert AI-generated questions
      for (let i = 0; i < aiQuestions.length; i++) {
        const question = aiQuestions[i];
        await c.env.DB.prepare(
          'INSERT INTO questions (session_id, text, options, order_index) VALUES (?, ?, ?, ?)'
        ).bind(session.id, question.text, JSON.stringify(question.options), standardQuestions.length + i + 1).run();
      }
    }

    // Get all questions
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

// Submit an answer
quizRouter.post('/:slug/answer', async (c) => {
  try {
    const slug = c.req.param('slug');
    const { question_id, selected_option } = await c.req.json();
    
    if (!question_id || !selected_option) {
      return c.json({ error: 'Question ID and selected option are required' }, 400);
    }

    // Verify question belongs to this session
    const question = await c.env.DB.prepare(`
      SELECT q.*, s.id as session_id 
      FROM questions q 
      JOIN sessions s ON q.session_id = s.id 
      WHERE q.id = ? AND s.slug = ?
    `).bind(question_id, slug).first();

    if (!question) {
      return c.json({ error: 'Question not found for this session' }, 404);
    }

    // Check if answer already exists
    const existingAnswer = await c.env.DB.prepare(
      'SELECT * FROM answers WHERE question_id = ?'
    ).bind(question_id).first();

    if (existingAnswer) {
      // Update existing answer
      await c.env.DB.prepare(
        'UPDATE answers SET selected_option = ? WHERE question_id = ?'
      ).bind(selected_option, question_id).run();
    } else {
      // Insert new answer
      await c.env.DB.prepare(
        'INSERT INTO answers (question_id, selected_option) VALUES (?, ?)'
      ).bind(question_id, selected_option).run();
    }

    return c.json({ success: true, message: 'Answer saved' });
  } catch (error) {
    console.error('Error saving answer:', error);
    return c.json({ error: 'Failed to save answer' }, 500);
  }
});

// Upload photo
quizRouter.post('/:slug/photo', async (c) => {
  try {
    const slug = c.req.param('slug');
    const formData = await c.req.formData();
    const photo = formData.get('photo');
    
    if (!photo || typeof photo === 'string') {
      return c.json({ error: 'Photo is required' }, 400);
    }

    const photoFile = photo as File;

    if (!photo) {
      return c.json({ error: 'Photo is required' }, 400);
    }

    // Get session
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE slug = ?'
    ).bind(slug).first();

    if (!session) {
      return c.json({ error: 'Quiz session not found' }, 404);
    }

    // Generate unique key for R2
    const photoKey = `photos/${slug}-${Date.now()}.jpg`;
    
    // Upload to R2
    await c.env.BUCKET.put(photoKey, photoFile.stream(), {
      httpMetadata: {
        contentType: photoFile.type
      }
    });

    // Update session with photo URL
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