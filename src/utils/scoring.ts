export interface TraitScore {
  label: string;
  emoji: string;
  description: string;
  score: number;
}

export interface TraitScores {
  [trait: string]: TraitScore;
}

export function calculateTraitScores(qaPairs: { question: string; answer: string }[]): TraitScores {
  // Initialize trait scores
  const scores: TraitScores = {
    love: { label: '', emoji: '💖', description: '', score: 0 },
    loyalty: { label: '', emoji: '🛡️', description: '', score: 0 },
    playfulness: { label: '', emoji: '🎾', description: '', score: 0 },
    intelligence: { label: '', emoji: '🧠', description: '', score: 0 },
    independence: { label: '', emoji: '🗽', description: '', score: 0 },
    mischief: { label: '', emoji: '😈', description: '', score: 0 },
    food_drive: { label: '', emoji: '🍖', description: '', score: 0 }
  };

  // Calculate base scores from answers
  for (const qa of qaPairs) {
    const question = qa.question.toLowerCase();
    const answer = qa.answer.toLowerCase();

    // Love scoring
    if (question.includes('greet') || question.includes('feeling sad')) {
      if (answer.includes('cuddles') || answer.includes('jumps all over') || answer.includes('comfort')) {
        scores.love.score += 20;
      } else if (answer.includes('happy') || answer.includes('wags')) {
        scores.love.score += 15;
      } else if (answer.includes('calm')) {
        scores.love.score += 10;
      }
    }

    // Loyalty scoring
    if (question.includes('left alone') || question.includes('new people') || question.includes('approach')) {
      if (answer.includes('waits by the door') || answer.includes('stays close') || answer.includes('protective')) {
        scores.loyalty.score += 20;
      } else if (answer.includes('nearby') || answer.includes('observes')) {
        scores.loyalty.score += 15;
      }
    }

    // Playfulness scoring
    if (question.includes('play') || question.includes('training')) {
      if (answer.includes('fetch') || answer.includes('play immediately') || answer.includes('excited')) {
        scores.playfulness.score += 20;
      } else if (answer.includes('tug') || answer.includes('toys')) {
        scores.playfulness.score += 15;
      }
    }

    // Intelligence scoring
    if (question.includes('training') || question.includes('puzzle')) {
      if (answer.includes('learns quickly') || answer.includes('puzzle') || answer.includes('brain games')) {
        scores.intelligence.score += 20;
      } else if (answer.includes('tricks') || answer.includes('shows off')) {
        scores.intelligence.score += 15;
      }
    }

    // Independence scoring
    if (question.includes('exploring') || question.includes('left alone')) {
      if (answer.includes('confidently leads') || answer.includes('sleeps peacefully') || answer.includes('ignores')) {
        scores.independence.score += 20;
      } else if (answer.includes('sniffs everything') || answer.includes('looks out window')) {
        scores.independence.score += 15;
      }
    }

    // Mischief scoring
    if (question.includes('left alone') || question.includes('bath')) {
      if (answer.includes('mischief') || answer.includes('escape') || answer.includes('distracted')) {
        scores.mischief.score += 20;
      }
    }

    // Food drive scoring
    if (question.includes('meal') || question.includes('training')) {
      if (answer.includes('excited') || answer.includes('drool') || answer.includes('guards food') || answer.includes('treats')) {
        scores.food_drive.score += 20;
      }
    }
  }

  // Normalize scores and generate labels
  for (const [trait, data] of Object.entries(scores)) {
    // Ensure minimum score and cap at 100
    data.score = Math.max(20, Math.min(100, data.score + Math.random() * 20));
    
    // Generate labels based on score ranges
    if (data.score >= 80) {
      data.label = getHighLabel(trait);
      data.description = getHighDescription(trait);
    } else if (data.score >= 60) {
      data.label = getMediumLabel(trait);
      data.description = getMediumDescription(trait);
    } else {
      data.label = getLowLabel(trait);
      data.description = getLowDescription(trait);
    }
  }

  return scores;
}

function getHighLabel(trait: string): string {
  const labels: { [key: string]: string[] } = {
    love: ['Snuggle Master', 'Love Bug Supreme', 'Cuddle Champion'],
    loyalty: ['Devoted Guardian', 'Faithful Companion', 'Loyal Knight'],
    playfulness: ['Play Maniac', 'Fun Factory', 'Energy Bomb'],
    intelligence: ['Genius Pup', 'Brainy Beauty', 'Smart Cookie'],
    independence: ['Free Spirit', 'Independent Thinker', 'Solo Explorer'],
    mischief: ['Trouble Maker', 'Sneaky Rascal', 'Chaos Creator'],
    food_drive: ['Food Fanatic', 'Treat Hunter', 'Snack Attack']
  };
  
  const options = labels[trait] || ['High Scorer'];
  return options[Math.floor(Math.random() * options.length)];
}

function getMediumLabel(trait: string): string {
  const labels: { [key: string]: string[] } = {
    love: ['Sweet Heart', 'Gentle Soul', 'Warm Companion'],
    loyalty: ['Steady Friend', 'Reliable Buddy', 'True Blue'],
    playfulness: ['Fun Loving', 'Happy Player', 'Joyful Spirit'],
    intelligence: ['Clever Pup', 'Quick Learner', 'Bright Mind'],
    independence: ['Balanced Explorer', 'Confident Walker', 'Self-Reliant'],
    mischief: ['Playful Scamp', 'Gentle Rebel', 'Mild Troublemaker'],
    food_drive: ['Food Lover', 'Treat Appreciator', 'Good Appetite']
  };
  
  const options = labels[trait] || ['Medium Scorer'];
  return options[Math.floor(Math.random() * options.length)];
}

function getLowLabel(trait: string): string {
  const labels: { [key: string]: string[] } = {
    love: ['Reserved Sweetheart', 'Subtle Lover', 'Quiet Affection'],
    loyalty: ['Independent Spirit', 'Friendly Acquaintance', 'Casual Companion'],
    playfulness: ['Calm Observer', 'Peaceful Soul', 'Relaxed Buddy'],
    intelligence: ['Intuitive Thinker', 'Natural Learner', 'Instinct-Driven'],
    independence: ['People-Focused', 'Social Butterfly', 'Pack Oriented'],
    mischief: ['Angel Pup', 'Well-Behaved', 'Model Citizen'],
    food_drive: ['Picky Eater', 'Casual Diner', 'Quality Over Quantity']
  };
  
  const options = labels[trait] || ['Low Scorer'];
  return options[Math.floor(Math.random() * options.length)];
}

function getHighDescription(trait: string): string {
  const descriptions: { [key: string]: string } = {
    love: "This pup wears their heart on their paw and loves with their whole being!",
    loyalty: "A devoted companion who will stand by your side through thick and thin.",
    playfulness: "Life is one big playground for this energetic and fun-loving dog!",
    intelligence: "This brilliant pup is always thinking and loves to show off their smarts.",
    independence: "A confident explorer who marches to the beat of their own drum.",
    mischief: "This little rascal keeps life interesting with their playful antics!",
    food_drive: "Food is life for this enthusiastic eater who never misses a meal!"
  };
  
  return descriptions[trait] || "A truly exceptional trait in this special dog!";
}

function getMediumDescription(trait: string): string {
  const descriptions: { [key: string]: string } = {
    love: "Shows affection in their own sweet way, making every moment special.",
    loyalty: "A dependable friend who's there when you need them most.",
    playfulness: "Enjoys a good game and knows how to have fun at the right times.",
    intelligence: "Smart and capable, picking up on things with ease.",
    independence: "Comfortable in their own skin while still enjoying companionship.",
    mischief: "Keeps things lively with just the right amount of playful trouble.",
    food_drive: "Appreciates good food and treats without going overboard."
  };
  
  return descriptions[trait] || "A wonderful balance in this personality trait!";
}

function getLowDescription(trait: string): string {
  const descriptions: { [key: string]: string } = {
    love: "Expresses love in subtle, meaningful ways that touch the heart.",
    loyalty: "Values freedom while maintaining warm friendships.",
    playfulness: "Finds joy in quiet moments and peaceful activities.",
    intelligence: "Uses natural wisdom and instinct to navigate the world.",
    independence: "Thrives on social connection and family bonds.",
    mischief: "A well-behaved companion who brings peace and harmony.",
    food_drive: "Has refined tastes and appreciates quality over quantity."
  };
  
  return descriptions[trait] || "A gentle and balanced approach to this trait.";
}