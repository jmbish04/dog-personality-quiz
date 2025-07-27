/**
 * HTML escaping utility to prevent XSS attacks
 * Escapes dangerous HTML characters that could be used for script injection
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}