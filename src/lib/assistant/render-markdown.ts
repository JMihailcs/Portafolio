/**
 * Assistant replies only (spec review decision, see system-prompt.ts): markdown -> sanitized HTML.
 * User bubbles keep using textContent — a visitor's own literal input is never interpreted as markdown.
 */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'a', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
];
const ALLOWED_ATTR = ['href'];

export function renderAssistantMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
