import { escapeHtml } from '../src/utils/htmlEscape';

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

console.log('🧪 Running HTML Escape Function Tests\n');

// Test cases for escapeHtml function
test('Should escape script tags', () => {
  const input = '<script>alert("xss")</script>';
  const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
  assertEquals(escapeHtml(input), expected);
});

test('Should escape img tags with onerror', () => {
  const input = '<img src=x onerror=alert("xss")>';
  const expected = '&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;';
  assertEquals(escapeHtml(input), expected);
});

test('Should escape ampersands', () => {
  const input = 'Tom & Jerry';
  const expected = 'Tom &amp; Jerry';
  assertEquals(escapeHtml(input), expected);
});

test('Should escape quotes', () => {
  const input = 'He said "Hello" and she said \'Hi\'';
  const expected = 'He said &quot;Hello&quot; and she said &#039;Hi&#039;';
  assertEquals(escapeHtml(input), expected);
});

test('Should escape less than and greater than', () => {
  const input = '5 < 10 > 3';
  const expected = '5 &lt; 10 &gt; 3';
  assertEquals(escapeHtml(input), expected);
});

test('Should handle empty string', () => {
  const input = '';
  const expected = '';
  assertEquals(escapeHtml(input), expected);
});

test('Should handle numbers by converting to string', () => {
  const input = 123;
  const expected = '123';
  assertEquals(escapeHtml(input as any), expected);
});

test('Should handle null and undefined', () => {
  assertEquals(escapeHtml(null as any), 'null');
  assertEquals(escapeHtml(undefined as any), 'undefined');
});

test('Should escape complex XSS payload', () => {
  const input = '<svg onload=alert("xss")><script>document.cookie</script></svg>';
  const expected = '&lt;svg onload=alert(&quot;xss&quot;)&gt;&lt;script&gt;document.cookie&lt;/script&gt;&lt;/svg&gt;';
  assertEquals(escapeHtml(input), expected);
});

test('Should preserve regular text', () => {
  const input = 'Regular text with no special characters';
  const expected = 'Regular text with no special characters';
  assertEquals(escapeHtml(input), expected);
});

console.log('\n📋 All tests completed!');

export {};