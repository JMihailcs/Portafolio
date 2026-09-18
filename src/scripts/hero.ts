import { initHeroReveal } from './hero-reveal';
import { initHeroVideo } from './hero-video';

const media = document.querySelector<HTMLElement>('[data-hero-media]');
const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (media && video) {
  initHeroVideo(video);
  initHeroReveal(media, video);
}
