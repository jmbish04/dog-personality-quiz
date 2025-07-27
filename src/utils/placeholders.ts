import { TraitScores } from './scoring';

/**
 * Creates simple SVG placeholder images for each personality trait
 */
export function createPlaceholderSVG(trait: string, emoji: string, label: string): string {
  const colors = {
    love: '#FFB3C6',
    loyalty: '#87CEEB', 
    playfulness: '#98FB98',
    intelligence: '#DDA0DD',
    independence: '#F0E68C',
    mischief: '#FFA07A',
    food_drive: '#DEB887'
  } as const;

  const bgColor = colors[trait as keyof typeof colors] || '#E0E0E0';
  
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${bgColor}" rx="200"/>
    <circle cx="200" cy="200" r="180" fill="white" fill-opacity="0.7"/>
    <text x="200" y="160" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="#333">${emoji}</text>
    <text x="200" y="220" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#333" font-weight="bold">${label}</text>
    <text x="200" y="250" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666">${trait.toUpperCase()}</text>
  </svg>`;
}

/**
 * Ensures placeholder images exist in the R2 bucket for all traits
 */
export async function ensurePlaceholdersExist(bucket: R2Bucket): Promise<void> {
  const traits = {
    love: { emoji: '💖', label: 'Love' },
    loyalty: { emoji: '🛡️', label: 'Loyalty' },
    playfulness: { emoji: '🎾', label: 'Playful' },
    intelligence: { emoji: '🧠', label: 'Smart' },
    independence: { emoji: '🗽', label: 'Independent' },
    mischief: { emoji: '😈', label: 'Mischievous' },
    food_drive: { emoji: '🍖', label: 'Food Lover' }
  };

  for (const [trait, config] of Object.entries(traits)) {
    const placeholderKey = `placeholders/${trait}.png`;
    
    try {
      // Check if placeholder already exists
      const existing = await bucket.head(placeholderKey);
      if (existing) {
        console.log(`Placeholder for ${trait} already exists`);
        continue;
      }
    } catch (error) {
      // Object doesn't exist, we'll create it
    }

    try {
      // Create SVG placeholder
      const svgContent = createPlaceholderSVG(trait, config.emoji, config.label);
      
      // Upload SVG as placeholder (R2 can serve SVGs directly)
      await bucket.put(placeholderKey.replace('.png', '.svg'), svgContent, {
        httpMetadata: {
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=31536000'
        }
      });
      
      console.log(`Created SVG placeholder for ${trait}`);
    } catch (error) {
      console.error(`Error creating placeholder for ${trait}:`, error);
    }
  }
}

/**
 * Returns a better fallback image key that actually exists
 */
export function getPlaceholderKey(trait: string): string {
  // Use SVG placeholders instead of PNG
  return `placeholders/${trait}.svg`;
}

/**
 * Creates a data URI for a simple placeholder when all else fails
 */
export function getDataURIPlaceholder(trait: string): string {
  const traits = {
    love: { symbol: '♥', label: 'Love', color: '#FFB3C6' },
    loyalty: { symbol: '⚡', label: 'Loyalty', color: '#87CEEB' },
    playfulness: { symbol: '●', label: 'Playful', color: '#98FB98' },
    intelligence: { symbol: '◉', label: 'Smart', color: '#DDA0DD' },
    independence: { symbol: '★', label: 'Independent', color: '#F0E68C' },
    mischief: { symbol: '~', label: 'Mischievous', color: '#FFA07A' },
    food_drive: { symbol: '♦', label: 'Food Lover', color: '#DEB887' }
  };

  const config = traits[trait as keyof typeof traits] || { symbol: '◆', label: 'Dog', color: '#E0E0E0' };
  
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="${config.color}" rx="100"/>
    <text x="100" y="120" font-family="Arial" font-size="40" text-anchor="middle" fill="#333">${config.symbol}</text>
    <text x="100" y="150" font-family="Arial" font-size="14" text-anchor="middle" fill="#333">${config.label}</text>
  </svg>`;
  
  // Use URL encoding for better browser compatibility
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}