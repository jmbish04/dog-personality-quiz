import { describe, test, expect } from 'vitest';
import { createPlaceholderSVG, getDataURIPlaceholder, getPlaceholderKey } from '../src/utils/placeholders';

describe('Placeholder utilities', () => {
  test('createPlaceholderSVG should generate valid SVG', () => {
    const svg = createPlaceholderSVG('love', '💖', 'Love');
    
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('💖');
    expect(svg).toContain('Love');
    expect(svg).toContain('#FFB3C6'); // love color
  });

  test('getDataURIPlaceholder should generate valid data URI', () => {
    const dataURI = getDataURIPlaceholder('loyalty');
    
    expect(dataURI).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(dataURI.length).toBeGreaterThan(50);
  });

  test('getPlaceholderKey should return SVG extension', () => {
    const key = getPlaceholderKey('intelligence');
    
    expect(key).toBe('placeholders/intelligence.svg');
  });

  test('should handle all trait types', () => {
    const traits = ['love', 'loyalty', 'playfulness', 'intelligence', 'independence', 'mischief', 'food_drive'];
    
    for (const trait of traits) {
      const svg = createPlaceholderSVG(trait, '🐶', 'Test');
      expect(svg).toContain('<svg');
      
      const dataURI = getDataURIPlaceholder(trait);
      expect(dataURI).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
      
      const key = getPlaceholderKey(trait);
      expect(key).toBe(`placeholders/${trait}.svg`);
    }
  });

  test('should handle unknown traits gracefully', () => {
    const svg = createPlaceholderSVG('unknown', '🐶', 'Unknown');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#E0E0E0'); // default color
    
    const dataURI = getDataURIPlaceholder('unknown');
    expect(dataURI).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    // Since it's URL encoded, we can decode to check the content
    const decoded = decodeURIComponent(dataURI.split('charset=utf-8,')[1]);
    expect(decoded).toContain('Dog');
  });
});