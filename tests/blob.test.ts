import { describe, expect, it } from 'vitest';
import { blobPath, blobPoints, closedPath } from '../src/lib/reveal/blob';

describe('blob', () => {
  it('with wobble 0 the points lie exactly on the ellipse', () => {
    const pts = blobPoints(100, 50, 40, 20, 3.7, 0, 12);
    expect(pts).toHaveLength(12);
    expect(pts[0].x).toBeCloseTo(140);
    expect(pts[0].y).toBeCloseTo(50);
    for (const p of pts) {
      const n = ((p.x - 100) / 40) ** 2 + ((p.y - 50) / 20) ** 2;
      expect(n).toBeCloseTo(1);
    }
  });
  it('wobble keeps every point within ±wobble of the base ellipse', () => {
    const w = 0.12;
    for (const t of [0, 1.3, 7.9, 42]) {
      for (const p of blobPoints(0, 0, 100, 60, t, w, 12)) {
        const r = Math.sqrt((p.x / 100) ** 2 + (p.y / 60) ** 2);
        expect(r).toBeGreaterThanOrEqual(1 - w - 1e-9);
        expect(r).toBeLessThanOrEqual(1 + w + 1e-9);
      }
    }
  });
  it('closedPath builds one cubic segment per point and closes', () => {
    const d = closedPath(blobPoints(0, 0, 10, 10, 0, 0, 8));
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(8);
  });
  it('a zero radius collapses to the centre', () => {
    const d = blobPath(30, 40, 0, 0, 1, 0.12);
    expect(d).toMatch(/^M30\.0 40\.0/);
    expect(d).not.toMatch(/NaN/);
  });
  it('is deterministic for the same inputs', () => {
    expect(blobPath(1, 2, 30, 20, 5)).toBe(blobPath(1, 2, 30, 20, 5));
  });
});
