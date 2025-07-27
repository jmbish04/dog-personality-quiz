export interface Question {
  text: string;
  options: string[];
}

export function getStandardQuestions(): Question[] {
  return [
    {
      text: "How does your dog typically greet you when you come home?",
      options: [
        "Jumps all over me with pure excitement",
        "Wags tail and brings me a toy",
        "Gives me a calm, happy look",
        "Takes a moment to acknowledge me"
      ]
    },
    {
      text: "When meeting new people, your dog usually:",
      options: [
        "Immediately wants pets and attention",
        "Observes from a distance first",
        "Hides behind me",
        "Acts like they've known them forever"
      ]
    },
    {
      text: "During meal times, your dog:",
      options: [
        "Sits patiently and waits",
        "Gets very excited and might drool",
        "Does tricks to earn their food",
        "Guards their food area"
      ]
    },
    {
      text: "When you're feeling sad, your dog:",
      options: [
        "Cuddles up close to comfort me",
        "Brings me toys to cheer me up",
        "Gives me space but stays nearby",
        "Doesn't seem to notice much"
      ]
    },
    {
      text: "Your dog's favorite type of play is:",
      options: [
        "Fetch and running games",
        "Tug-of-war",
        "Puzzle toys and brain games",
        "Wrestling with other dogs"
      ]
    },
    {
      text: "When left alone, your dog typically:",
      options: [
        "Sleeps peacefully",
        "Looks out the window",
        "Gets into mischief",
        "Waits by the door for my return"
      ]
    },
    {
      text: "During training sessions, your dog:",
      options: [
        "Learns quickly and eagerly",
        "Needs lots of treats to stay motivated",
        "Gets distracted easily",
        "Shows off once they know a trick"
      ]
    },
    {
      text: "When exploring new places, your dog:",
      options: [
        "Confidently leads the way",
        "Stays close to me",
        "Sniffs everything thoroughly",
        "Looks for other dogs to play with"
      ]
    },
    {
      text: "Your dog's reaction to bath time is:",
      options: [
        "Tries to escape at all costs",
        "Tolerates it for treats",
        "Actually seems to enjoy it",
        "Gives me the saddest puppy eyes"
      ]
    },
    {
      text: "When other dogs approach, your dog:",
      options: [
        "Wants to play immediately",
        "Assesses the situation first",
        "Gets protective of me",
        "Ignores them completely"
      ]
    }
  ];
}

export async function generateAIQuestions(ai: any, previousAnswers: any[], session: any): Promise<Question[]> {
  const traits = ['love', 'loyalty', 'playfulness', 'intelligence', 'independence'];
  const questions: Question[] = [];
  
  const answerSummary = previousAnswers.map(qa => `Q: ${qa.question} A: ${qa.answer}`).join('\n');
  
  for (const trait of traits) {
    const prompt = `Generate 1 fun multiple-choice question to assess ${trait} in a dog named ${session.dog_name}. Base it on what we know from previous answers:

${answerSummary}

Return ONLY a JSON object with this exact format:
{
  "text": "Your question here",
  "options": ["option1", "option2", "option3", "option4"]
}

Make the question engaging and specific to understanding the dog's ${trait}.`;

    try {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }]
      });
      
      const questionData = JSON.parse(response.response);
      if (questionData.text && questionData.options && Array.isArray(questionData.options)) {
        questions.push(questionData);
      }
    } catch (error) {
      console.error(`Error generating AI question for ${trait}:`, error);
      // Fallback question
      questions.push({
        text: `How would you describe your dog's ${trait}?`,
        options: ['Very high', 'High', 'Moderate', 'Low']
      });
    }
  }
  
  return questions;
}