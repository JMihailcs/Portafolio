export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function clampToRect(p: Pt, r: Rect): Pt {
  return { x: clamp(p.x, r.x, r.x + r.w), y: clamp(p.y, r.y, r.y + r.h) };
}

/**
 * Where an `object-fit: cover` media of `aspect` (width/height) is drawn inside a cw×ch container.
 * posX/posY are `object-position` fractions (0..1).
 */
export function coverBox(cw: number, ch: number, aspect: number, posX: number, posY: number): Rect {
  const scale = Math.max(cw / aspect, ch); // px per unit of media height
  const w = aspect * scale;
  const h = scale;
  return { x: (cw - w) * posX, y: (ch - h) * posY, w, h };
}

/** Converts a rectangle expressed as fractions of the media frame into container pixels. */
export function mapRect(fraction: Rect, box: Rect): Rect {
  return {
    x: box.x + fraction.x * box.w,
    y: box.y + fraction.y * box.h,
    w: fraction.w * box.w,
    h: fraction.h * box.h,
  };
}
