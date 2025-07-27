import { TraitScores } from './scoring';

export async function generatePersonalityTitle(ai: any, session: any, scores: TraitScores): Promise<string> {
  // Get top 2 traits
  const sortedTraits = Object.entries(scores)
    .sort(([,a], [,b]) => b.score - a.score)
    .slice(0, 2);

  const topTrait = sortedTraits[0];
  const secondTrait = sortedTraits[1];

  const prompt = `Create a fun, engaging personality title for a dog named ${session.dog_name} (${session.breed || 'mixed breed'}) based on their top personality traits:

Top trait: ${topTrait[0]} (${topTrait[1].label})
Second trait: ${secondTrait[0]} (${secondTrait[1].label})

Examples:
- "Fluffy is a Lovable Mischief Maker"
- "Max is a Loyal Adventure Buddy"
- "Bella is a Smart and Snuggly Sweetheart"

Create a similar title that captures ${session.dog_name}'s unique personality. Keep it under 8 words and make it catchy!

Return ONLY the title, nothing else.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }]
    });
    
    let title = response.response.trim();
    
    // Clean up the response
    title = title.replace(/^["']|["']$/g, ''); // Remove quotes
    title = title.replace(/^\w+:\s*/, ''); // Remove "Title:" prefix if present
    
    // Fallback if AI response is weird
    if (title.length > 80 || title.length < 10) {
      title = `${session.dog_name} is a ${topTrait[1].label}`;
    }
    
    return title;
  } catch (error) {
    console.error('Error generating personality title:', error);
    return `${session.dog_name} is a ${topTrait[1].label}`;
  }
}