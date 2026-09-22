export type Lang = 'es' | 'en';
export type ProjectId = 'mikha' | 'graphrag' | 'semantic';

export interface Project { id: ProjectId; title: string; year: string; summary: string; tags: string[] }
export interface Job { role: string; org: string; period: string; place: string; bullets: string[] }
export interface TitleBody { title: string; body: string }

export interface Dict {
  meta: { title: string; description: string; ogAlt: string };
  nav: { aria: string; menu: string; home: string; work: string; experience: string; about: string; contact: string; switchLabel: string };
  hero: {
    headline: [string, string]; sub: string; ctaPrimary: string; ctaSecondary: string; cv: string;
    mediaAlt: string; cards: { id: ProjectId; label: string }[];
  };
  whatIDo: { kicker: string; problem: string; benefits: TitleBody[] };
  work: { kicker: string; featured: Project[]; viewCode: string; moreTitle: string; more: TitleBody[] };
  experience: { kicker: string; jobs: Job[] };
  about: {
    kicker: string; profile: string; stackTitle: string; stack: string[];
    eventsTitle: string; events: TitleBody[]; languagesTitle: string; languages: string[];
  };
  contact: { kicker: string; title: string; body: string; cta: string; location: string };
  footer: { rights: string };
  assistant: {
    label: string;        // aria-label of the floating button
    title: string;        // dialog heading / aria-label
    placeholder: string;  // input placeholder + aria-label
    send: string;         // aria-label of the send button
    close: string;        // aria-label of the close button
    suggestions: [string, string, string];
    privacy: string;      // spec §7 notice
    streaming: string;    // shown while the answer streams
    error: string;        // generic failure (incl. refusal)
    limited: string;      // 429 state
    off: string;          // 503 disabled state
  };
}
