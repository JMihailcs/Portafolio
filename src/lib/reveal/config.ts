import type { Rect } from './geometry';

/** Every rectangle is a fraction of the 16:9 source frame (measured on assets/hero/image-1.png, 1672×941). */
export const MEDIA_ASPECT = 16 / 9;
/** Region the window's centre may travel in: eyes and brow. */
export const CENTER_ZONE: Rect = { x: 0.705, y: 0.29, w: 0.05, h: 0.05 };
/** Max blob radii as fractions of the frame WIDTH (both axes), so the shape keeps its proportions. */
export const RADIUS = { rx: 0.062, ry: 0.036 };
/** Pointer hit area: the face. */
export const HIT_AREA: Rect = { x: 0.62, y: 0.12, w: 0.21, h: 0.46 };
/** Area covered by the glass slats. */
export const SLATS_AREA: Rect = { x: 0.61, y: 0.1, w: 0.23, h: 0.5 };
export const SLAT_WEIGHTS = [1, 1.4, 0.8, 1.6, 1, 1.2];
export const SLAT_SHIFT_PX = 14;
export const LERP = 0.12;
export const OPEN_S = 0.6;
export const PEEK_EVERY_MS = 6000;
export const PEEK_HOLD_MS = 1500;
