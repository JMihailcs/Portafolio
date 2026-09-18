import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Fade-up per block as it enters the viewport, batched so siblings stagger. */
export function initScrollReveals(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.set('[data-reveal]', { y: 28, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true, clearProps: 'transform',
    }),
  });
}
