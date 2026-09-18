import type { Lang, ProjectId } from '../i18n/types';

const github = 'https://github.com/JMihailcs';

export const site = {
  name: 'Johan Mihail Conde Sallo',
  email: 'jm.condesallo@gmail.com',
  github,
  linkedin: 'https://www.linkedin.com/in/johan-mihail-conde-sallo-12a871419',
  cv: { es: '/cv/CV_AI_Engineer_ES.pdf', en: '/cv/CV_AI_Engineer_EN.pdf' } satisfies Record<Lang, string>,
  // Mikha and Semantic Search repos are not in the CV: they point to the GitHub profile until URLs are provided.
  projectLinks: {
    mikha: github,
    graphrag: 'https://github.com/JMihailcs/RAG-Historical_Documents',
    semantic: github,
  } satisfies Record<ProjectId, string>,
} as const;
