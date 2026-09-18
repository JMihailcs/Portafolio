import { initCursor } from './cursor';
import { initEntrance } from './entrance';
import { initScrollReveals } from './scroll';

initEntrance();
initScrollReveals();
initCursor();
// Elements that were hidden by the CSS guard are now owned by GSAP (or the user opted out of motion).
document.documentElement.classList.add('show');
