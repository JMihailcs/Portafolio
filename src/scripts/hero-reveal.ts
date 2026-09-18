import { gsap } from 'gsap';
import { blobPath } from '../lib/reveal/blob';
import * as C from '../lib/reveal/config';
import { clampToRect, coverBox, lerp, mapRect, type Pt, type Rect } from '../lib/reveal/geometry';

const px = (n: number): string => `${n.toFixed(1)}px`;
const place = (el: HTMLElement, r: Rect): void => {
  el.style.left = px(r.x); el.style.top = px(r.y); el.style.width = px(r.w); el.style.height = px(r.h);
};

/** Reads the computed `object-position` of the video as 0..1 fractions. */
function objectPosition(el: HTMLElement): [number, number] {
  const [x = '50%', y = '50%'] = getComputedStyle(el).objectPosition.split(' ');
  const f = (v: string): number => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5);
  return [f(x), f(y)];
}

export function initHeroReveal(media: HTMLElement, video: HTMLVideoElement): void {
  const q = <T extends Element>(s: string): T | null => media.querySelector<T>(s);
  const layer = q<HTMLElement>('[data-reveal-layer]');
  const term = q<HTMLElement>('[data-reveal-term]');
  const rim = q<SVGPathElement>('[data-rim]');
  const slatsEl = q<HTMLElement>('[data-slats]');
  const hit = q<HTMLElement>('[data-hit]');
  if (!layer || !term || !rim || !slatsEl || !hit) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchOnly = matchMedia('(hover: none)').matches;

  let zone: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let hitRect: Rect = zone;
  let radius = { rx: 0, ry: 0 };

  const measure = (): void => {
    const r = media.getBoundingClientRect();
    const [ox, oy] = objectPosition(video);
    const box = coverBox(r.width, r.height, C.MEDIA_ASPECT, ox, oy);
    zone = mapRect(C.CENTER_ZONE, box);
    hitRect = mapRect(C.HIT_AREA, box);
    radius = { rx: C.RADIUS.rx * box.w, ry: C.RADIUS.ry * box.w };
    place(hit, hitRect);
    place(slatsEl, mapRect(C.SLATS_AREA, box));
    // Terminal panel covers everything the blob can reach (zone + radii + 20% wobble margin).
    place(term, {
      x: zone.x - radius.rx * 1.2, y: zone.y - radius.ry * 1.2,
      w: zone.w + radius.rx * 2.4, h: zone.h + radius.ry * 2.4,
    });
  };
  measure();
  new ResizeObserver(measure).observe(media);

  // --- blob state -------------------------------------------------------
  const state = { k: 0 }; // openness 0..1
  const target: Pt = { x: 0, y: 0 };
  const cur: Pt = { x: 0, y: 0 };
  let inside = false;
  let visible = false;
  let raf = 0;
  const t0 = performance.now();

  const draw = (): void => {
    if (state.k < 0.002) {
      layer.style.clipPath = 'circle(0px)';
      rim.setAttribute('d', '');
      return;
    }
    cur.x = lerp(cur.x, target.x, reduce ? 1 : C.LERP);
    cur.y = lerp(cur.y, target.y, reduce ? 1 : C.LERP);
    const t = (performance.now() - t0) / 1000;
    const d = blobPath(cur.x, cur.y, radius.rx * state.k, radius.ry * state.k, t, reduce ? 0 : 0.12);
    layer.style.clipPath = `path("${d}")`;
    rim.setAttribute('d', d);
    rim.style.opacity = String(Math.min(1, state.k * 1.5));
  };
  const tick = (): void => {
    draw();
    raf = visible && (state.k > 0.002 || inside) ? requestAnimationFrame(tick) : 0;
  };
  const start = (): void => { if (!raf && visible) raf = requestAnimationFrame(tick); };

  let peekTl: gsap.core.Timeline | null = null;
  const openTo = (v: 0 | 1, delay = 0): void => {
    peekTl?.kill();
    peekTl = null;
    if (reduce) { state.k = v; start(); return; }
    gsap.to(state, { k: v, duration: C.OPEN_S, delay, ease: v ? 'power3.out' : 'power2.inOut', overwrite: true, onUpdate: start });
  };

  // --- glass slats ------------------------------------------------------
  const slats = Array.from(slatsEl.children) as HTMLElement[];
  const shift = reduce ? [] : slats.map((s) => gsap.quickTo(s, 'x', { duration: 0.8, ease: 'power3.out' }));
  const moveSlats = (localX: number): void => {
    if (!shift.length) return;
    const n = (localX - hitRect.x) / hitRect.w; // 0..1 across the face
    shift.forEach((to, i) => to((n - 0.5) * 2 * C.SLAT_SHIFT_PX * (i % 2 ? 1 : -1) * (0.5 + i * 0.15)));
  };
  const restSlats = (): void => shift.forEach((to) => to(0));

  // --- pointer (mouse, pen and touch share these events) -----------------
  const local = (e: PointerEvent): Pt => {
    const r = media.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  hit.addEventListener('pointerenter', (e) => {
    inside = true;
    const p = clampToRect(local(e), zone);
    if (state.k < 0.002) { cur.x = p.x; cur.y = p.y; }
    target.x = p.x; target.y = p.y;
    openTo(1);
    start();
  });
  hit.addEventListener('pointermove', (e) => {
    const l = local(e);
    const p = clampToRect(l, zone);
    target.x = p.x; target.y = p.y;
    moveSlats(l.x);
  });
  hit.addEventListener('pointerleave', (e) => {
    inside = false;
    openTo(0, e.pointerType === 'touch' ? 0.9 : 0); // on touch, linger briefly after the finger lifts
    restSlats();
  });

  // --- auto "peek" on touch-only devices ----------------------------------
  if (touchOnly && !reduce) {
    window.setInterval(() => {
      if (!visible || inside || state.k > 0.002) return;
      target.x = cur.x = zone.x + zone.w / 2;
      target.y = cur.y = zone.y + zone.h / 2;
      peekTl = gsap.timeline({ onUpdate: start })
        .to(state, { k: 1, duration: C.OPEN_S, ease: 'power3.out' })
        .to(state, { k: 0, duration: C.OPEN_S, ease: 'power2.inOut' }, `+=${C.PEEK_HOLD_MS / 1000}`);
    }, C.PEEK_EVERY_MS);
  }

  // --- only run while the hero is on screen --------------------------------
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else {
      gsap.killTweensOf(state);
      peekTl?.kill();
      peekTl = null;
      inside = false;
      state.k = 0;
      draw();
    }
  }).observe(media);
}
