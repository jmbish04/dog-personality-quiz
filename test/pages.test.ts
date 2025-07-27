import { describe, test, expect } from 'vitest';
import { getHomePage, getQuizPage, getResultsPage } from '../src/templates/pages';

describe('HTML Template Pages', () => {
  test('getHomePage should return valid HTML', () => {
    const html = getHomePage();
    
    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('<title>🐶 Dog Personality Quiz</title>');
    expect(html).toContain('class="container mx-auto px-4 py-8"');
    expect(html).toContain('Start Quiz');
  });

  test('getQuizPage should substitute dynamic content', () => {
    const mockSession = {
      dog_name: 'Max',
      photo_url: null
    };
    
    const html = getQuizPage('test-slug', mockSession);
    
    expect(html).toContain('Max\'s Personality Quiz');
    expect(html).toContain('Upload Max\'s Photo');
    expect(html).toContain('/api/quiz/test-slug/questions');
    expect(html).toContain('display: block'); // photo upload should be visible
  });

  test('getQuizPage should handle existing photo', () => {
    const mockSession = {
      dog_name: 'Luna',
      photo_url: 'photo.jpg'
    };
    
    const html = getQuizPage('slug-with-photo', mockSession);
    
    expect(html).toContain('Luna\'s Personality Quiz');
    expect(html).toContain('display: none'); // photo upload should be hidden
    expect(html).toContain('photo.jpg');
  });

  test('getResultsPage should render trait sections', () => {
    const mockSessionData = {
      title: 'Max is a Loyal Companion',
      dog_name: 'Max', 
      summary: 'Test summary',
      scores: JSON.stringify({
        love: {
          emoji: '💖',
          label: 'Very High',
          description: 'Extremely loving dog',
          score: 95
        }
      }),
      generated_images: JSON.stringify({})
    };
    
    const html = getResultsPage('test-results', mockSessionData);
    
    expect(html).toContain('Max is a Loyal Companion');
    expect(html).toContain('Test summary');
    expect(html).toContain('💖 LOVE - Very High');
    expect(html).toContain('Extremely loving dog');
    expect(html).toContain('95/100');
  });

  test('should properly escape HTML in dynamic content', () => {
    const mockSession = {
      dog_name: '<script>alert("xss")</script>',
      photo_url: null
    };
    
    const html = getQuizPage('test-escape', mockSession);
    
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('should prevent JavaScript XSS vulnerability in results page', () => {
    const mockSessionData = {
      title: 'Test Results',
      dog_name: "Pat's Dog'; alert('XSS'); var dummy='",
      summary: 'Test summary',
      scores: JSON.stringify({
        love: {
          emoji: '💖',
          label: 'High',
          description: 'Loving dog',
          score: 80
        }
      }),
      generated_images: JSON.stringify({})
    };
    
    const html = getResultsPage('test-xss', mockSessionData);
    
    // The XSS should now be prevented by JSON.stringify in JavaScript contexts
    // Dangerous unescaped content should not be present in JavaScript
    expect(html).not.toContain("Pat's Dog'; alert('XSS'); var dummy=''s personality");
    
    // JSON.stringify should properly escape the dangerous content in JavaScript
    expect(html).toContain('"Pat\'s Dog\'; alert(\'XSS\'); var dummy=\'"');
    
    // Check that HTML contexts still properly escape (quotes become &#039;)
    expect(html).toContain('Chat about Pat&#039;s Dog&#039;; alert(&#039;XSS&#039;); var dummy=&#039;');
  });
});