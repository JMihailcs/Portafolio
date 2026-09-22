// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderAssistantMarkdown } from '../../src/lib/assistant/render-markdown';

describe('renderAssistantMarkdown', () => {
  it('renders basic formatting', () => {
    const html = renderAssistantMarkdown('**bold** and *italic* and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
  });

  it('renders lists and paragraphs', () => {
    const html = renderAssistantMarkdown('- one\n- two');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('renders safe links', () => {
    const html = renderAssistantMarkdown('[Johan](https://example.com)');
    expect(html).toContain('<a href="https://example.com">Johan</a>');
  });

  it('strips <script> tags and their content never executes', () => {
    const html = renderAssistantMarkdown('hello <script>alert(1)</script> world');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });

  it('strips onerror handlers from an injected <img>', () => {
    const html = renderAssistantMarkdown('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<img');
  });

  it('neutralises javascript: link URLs', () => {
    const html = renderAssistantMarkdown('[link](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('neutralises data: link URLs', () => {
    const html = renderAssistantMarkdown('[link](data:text/html,<script>alert(1)</script>)');
    expect(html).not.toContain('data:text/html');
    expect(html).not.toContain('<script');
  });

  it('strips iframes', () => {
    const html = renderAssistantMarkdown('<iframe src="https://evil.example"></iframe>');
    expect(html).not.toContain('<iframe');
  });

  it('strips forms', () => {
    const html = renderAssistantMarkdown('<form action="https://evil.example"><input></form>');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<input');
  });

  it('strips arbitrary event handler attributes on allowed tags', () => {
    const html = renderAssistantMarkdown('<a href="https://example.com" onclick="alert(1)">click</a>');
    expect(html).not.toContain('onclick');
  });

  it('does not allow raw arbitrary HTML passthrough', () => {
    const html = renderAssistantMarkdown('<div class="evil"><span>x</span></div>');
    expect(html).not.toContain('<div');
    expect(html).not.toContain('<span');
  });
});
