import { gsap } from 'gsap';

/** Ring that trails the native cursor (the native cursor stays visible). Fine pointers only. */
export function initCursor(): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ring = document.querySelector<HTMLElement>('[data-cursor]');
  if (!ring) return;

  const x = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); ring.style.opacity = '1'; }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const on = (e.target as HTMLElement).closest('a, button, summary, [data-hit]');
    ring.classList.toggle('is-active', on !== null);
  });
  document.documentElement.addEventListener('pointerleave', () => { ring.style.opacity = '0'; });
}
