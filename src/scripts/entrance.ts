import { gsap } from 'gsap';

/** Staggered hero entrance; nothing moves when the user prefers reduced motion. */
export function initEntrance(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = gsap.utils.toArray<HTMLElement>('[data-in]');
  gsap.from(items, {
    y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.1,
    clearProps: 'transform,opacity',
  });
}
