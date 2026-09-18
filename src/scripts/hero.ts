import { initHeroVideo } from './hero-video';

const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (video) initHeroVideo(video);
