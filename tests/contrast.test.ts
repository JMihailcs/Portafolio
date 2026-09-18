import { describe, expect, it } from 'vitest';
import { blend, contrast } from '../src/lib/contrast';

const T = { ink: '#14090B', bone: '#F3E9E4', deep: '#5A1409', vermilion: '#E34234', amber: '#FFB347' };

describe('design token contrast (WCAG AA 4.5:1 for normal text)', () => {
  const pairs: [string, string, string][] = [
    ['bone on ink', T.bone, T.ink],
    ['bone on vermilion-deep (hero copy)', T.bone, T.deep],
    ['bone 72% on vermilion-deep (secondary hero text)', blend(T.bone, T.deep, 0.72), T.deep],
    ['ink on bone (primary button)', T.ink, T.bone],
    ['ink on vermilion', T.ink, T.vermilion],
    ['amber on ink (kickers, arrows)', T.amber, T.ink],
    ['amber on vermilion-deep', T.amber, T.deep],
    ['bone 72% on ink', blend(T.bone, T.ink, 0.72), T.ink],
  ];
  for (const [name, fg, bg] of pairs) {
    it(name, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5));
  }
  it('documents why vermilion-vivid never carries text', () => {
    expect(contrast(T.ink, '#D63A22')).toBeLessThan(4.5);
  });
});
