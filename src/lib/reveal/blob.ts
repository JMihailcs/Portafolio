import type { Pt } from './geometry';

/** Points of a slightly wobbling ellipse; each point's radius factor stays within 1 ± wobble. */
export function blobPoints(cx: number, cy: number, rx: number, ry: number, t: number, wobble = 0.12, n = 12): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wobble * Math.sin(t * 1.3 + i * 1.7) * Math.cos(t * 0.7 + i * 0.9);
    pts.push({ x: cx + Math.cos(a) * rx * w, y: cy + Math.sin(a) * ry * w });
  }
  return pts;
}

const f = (v: number): string => v.toFixed(1);

/** Closed Catmull-Rom spline converted to cubic Béziers (SVG / CSS path() syntax). */
export function closedPath(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return `${d}Z`;
}

export const blobPath = (cx: number, cy: number, rx: number, ry: number, t: number, wobble = 0.12, n = 12): string =>
  closedPath(blobPoints(cx, cy, rx, ry, t, wobble, n));
