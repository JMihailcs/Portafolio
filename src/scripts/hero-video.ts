/** Starts the ambient loop unless the user prefers reduced motion or asked for reduced data. */
export function initHeroVideo(video: HTMLVideoElement): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  if (reduce || saveData) return; // poster stays as the still image

  const mobile = matchMedia('(max-width: 767px)').matches;
  video.src = (mobile ? video.dataset.srcMobile : video.dataset.srcDesktop) ?? '';
  video.addEventListener('canplay', () => { void video.play().catch(() => {}); }, { once: true });
  video.load();
}
