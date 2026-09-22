import { initAssistant } from './assistant';
import { initCursor } from './cursor';
import { initEntrance } from './entrance';
import { initScrollReveals } from './scroll';

initEntrance();
initScrollReveals();
initCursor();
initAssistant();
// Elements that were hidden by the CSS guard are now owned by GSAP (or the user opted out of motion).
document.documentElement.classList.add('show');
