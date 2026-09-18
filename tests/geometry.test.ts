import { describe, expect, it } from 'vitest';
import { clamp, clampToRect, coverBox, lerp, mapRect, type Rect } from '../src/lib/reveal/geometry';

// Float math (and -0) make exact toEqual brittle; compare rectangles numerically.
const near = (a: Rect, b: Rect): void => {
  for (const k of ['x', 'y', 'w', 'h'] as const) expect(a[k]).toBeCloseTo(b[k], 6);
};

describe('geometry', () => {
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(4, 4, 0.9)).toBe(4);
  });
  it('clamp bounds a value', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('clampToRect keeps a point inside the rectangle', () => {
    const r = { x: 10, y: 10, w: 20, h: 10 };
    expect(clampToRect({ x: 0, y: 100 }, r)).toEqual({ x: 10, y: 20 });
    expect(clampToRect({ x: 15, y: 12 }, r)).toEqual({ x: 15, y: 12 });
  });
  it('coverBox of a container with the media aspect fills it exactly', () => {
    near(coverBox(1600, 900, 16 / 9, 0.5, 0.5), { x: 0, y: 0, w: 1600, h: 900 });
  });
  it('coverBox crops horizontally in a narrow container and honours object-position', () => {
    // 500x500 container, 2:1 media: scale by height -> 1000x500 drawn, right-aligned (posX=1)
    near(coverBox(500, 500, 2, 1, 0.5), { x: -500, y: 0, w: 1000, h: 500 });
    near(coverBox(500, 500, 2, 0, 0.5), { x: 0, y: 0, w: 1000, h: 500 });
  });
  it('mapRect converts frame fractions into container pixels', () => {
    const box = { x: -500, y: 0, w: 1000, h: 500 };
    near(mapRect({ x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, box), { x: 0, y: 250, w: 100, h: 50 });
  });
});
