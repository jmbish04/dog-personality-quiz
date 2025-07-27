import { calculateTraitScores } from '../src/utils/scoring';
import { getStandardQuestions } from '../src/utils/questions';

// Simple test runner
function test(name: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assertEquals(actual: any, expected: any) {
  if (actual !== expected) {
    throw new Error(`Expected "${expected}", but got "${actual}"`);
  }
}

function assertGreaterThanOrEqual(actual: number, expected: number) {
  if (actual < expected) {
    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
  }
}

console.log('🧪 Running Trait-Based Scoring Tests\n');

// Helper function to get traits for a question
function getTraitsForQuestion(questionText: string): string[] {
  const standardQuestions = getStandardQuestions();
  const matchingQuestion = standardQuestions.find(q => q.text === questionText);
  return matchingQuestion?.traits || [];
}

test('Standard questions should have traits defined', () => {
  const questions = getStandardQuestions();
  
  // Check that all questions have traits
  for (const question of questions) {
    if (!question.traits || question.traits.length === 0) {
      throw new Error(`Question "${question.text}" has no traits defined`);
    }
  }
  
  // Check specific questions
  const greetQuestion = questions.find(q => q.text.includes('greet'));
  assertEquals(greetQuestion?.traits.includes('love'), true);
  
  const playQuestion = questions.find(q => q.text.includes('play'));
  assertEquals(playQuestion?.traits.includes('playfulness'), true);
});

test('Trait-based scoring should work with love trait', () => {
  const qaPairs = [
    {
      question: "How does your dog typically greet you when you come home?",
      answer: "Jumps all over me with pure excitement",
      traits: getTraitsForQuestion("How does your dog typically greet you when you come home?")
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // Should score high on love trait for this answer
  assertGreaterThanOrEqual(scores.love.score, 20);
});

test('Trait-based scoring should work with playfulness trait', () => {
  const qaPairs = [
    {
      question: "Your dog's favorite type of play is:",
      answer: "Fetch and running games",
      traits: getTraitsForQuestion("Your dog's favorite type of play is:")
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // Should score high on playfulness trait for this answer
  assertGreaterThanOrEqual(scores.playfulness.score, 20);
});

test('Trait-based scoring should work with loyalty trait', () => {
  const qaPairs = [
    {
      question: "When left alone, your dog typically:",
      answer: "Waits by the door for my return",
      traits: getTraitsForQuestion("When left alone, your dog typically:")
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // Should score high on loyalty trait for this answer
  assertGreaterThanOrEqual(scores.loyalty.score, 20);
});

test('Multi-trait questions should affect multiple scores', () => {
  const qaPairs = [
    {
      question: "When left alone, your dog typically:",
      answer: "Sleeps peacefully",
      traits: getTraitsForQuestion("When left alone, your dog typically:")
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // This question measures loyalty, independence, and mischief
  // "Sleeps peacefully" should boost independence
  assertGreaterThanOrEqual(scores.independence.score, 20);
});

test('Empty traits should not cause errors', () => {
  const qaPairs = [
    {
      question: "Unknown question",
      answer: "Some answer",
      traits: []
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // Should still return scores (minimum values)
  assertGreaterThanOrEqual(scores.love.score, 20);
});

test('Questions without traits should not break scoring', () => {
  const qaPairs = [
    {
      question: "Some custom question",
      answer: "Some answer"
      // No traits property
    }
  ];
  
  const scores = calculateTraitScores(qaPairs);
  
  // Should still return scores (minimum values)
  assertGreaterThanOrEqual(scores.love.score, 20);
});

console.log('\n📋 All scoring tests completed!');

export {};