# Portafolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (ES/EN) portfolio of Johan Mihail Conde Sallo as a static Astro site whose hero is a marble-bust video with a hover "reveal" window over the face.

**Architecture:** Astro 6 static site, one page per language (`/es`, `/en`), all copy in typed dictionaries. Hero = looping video + a DOM reveal layer clipped by an animated organic blob that follows the pointer inside a face zone; geometry and blob math are pure, unit-tested modules; the runtime (GSAP + rAF) is verified in the browser.

**Tech Stack:** Astro 6, Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript, GSAP 3 (+ScrollTrigger), `@astrojs/sitemap`, Vitest, ffmpeg (asset pipeline).

**Spec:** `docs/superpowers/specs/2026-09-18-portafolio-design.md`

## Global Constraints

- Astro 6, Tailwind 4 via `@tailwindcss/vite`, GSAP 3, no React, no ShadCN (spec §4).
- Colors (spec §5): `--vermilion #E34234`, `--vermilion-deep #5A1409`, `--vermilion-vivid #D63A22`, `--ink #14090B`, `--bone #F3E9E4`, `--amber #FFB347`. Secondary text = bone at 72%. Text never sits on `--vermilion-vivid`; amber is never small text on vermilion.
- Fonts: Instrument Serif (display, uppercase, tracking slightly negative), DM Sans (body), JetBrains Mono (terminal layer). `font-display: swap`.
- Copy lives only in `src/i18n/{es,en}.ts`; templates contain no literal user-facing text.
- Phone number is never shown on the site (only inside the CV PDFs, approved by the user).
- Only `transform` and `opacity` are animated, except the reveal blob's `clip-path` (rAF, only while pointer is over the hero).
- `prefers-reduced-motion`: poster only, no video, no auto-peek, no wobble, no text/slat movement.
- Contrast WCAG AA (4.5:1) for normal text; touch targets ≥ 44px; one `h1` per page.
- No Lorem Ipsum or placeholder content in the final build; card images `a|b|c` may be missing until the user generates them (fallback tile is allowed).
- Commits end with the trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

```
Portafolio/
├── astro.config.mjs · tsconfig.json · vitest.config.ts · package.json · .gitignore · README.md
├── scripts/build-hero-media.sh          # ffmpeg: ping-pong loop, poster, OG image
├── assets/hero/{image-1.png,image-2.png,transition.mp4}   # sources (already present)
├── assets/cards/{a,b,c}.png             # user-generated (pending)
├── public/{favicon.svg,og.jpg,cv/,media/}
├── src/
│   ├── styles/global.css                # tokens, base, buttons, motion guards
│   ├── data/site.ts                     # contact, CV paths, project links
│   ├── i18n/{types.ts,es.ts,en.ts,index.ts}
│   ├── lib/
│   │   ├── contrast.ts                  # WCAG helpers (token guard test)
│   │   └── reveal/{geometry.ts,blob.ts,config.ts}   # pure, unit-tested
│   ├── scripts/{hero.ts,hero-video.ts,hero-reveal.ts,main.ts,entrance.ts,scroll.ts,cursor.ts}
│   ├── layouts/Base.astro
│   ├── components/{Page,Nav,Hero,HeroReveal,HeroCards,WhatIDo,Work,Experience,About,Contact,Footer}.astro
│   ├── assets/cards/                    # copied from assets/cards when available
│   └── pages/{index.astro,es/index.astro,en/index.astro}
└── tests/{i18n,geometry,blob,contrast}.test.ts
```

---

### Task 1: Scaffold Astro + Tailwind + Vitest

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/styles/global.css`, `src/pages/index.astro`

**Interfaces:**
- Produces: CSS tokens available as Tailwind utilities (`bg-ink`, `text-bone`, `text-amber`, `bg-vermilion`, `font-display`, `font-body`, `font-mono`); `npm run build`, `npm test`.

- [ ] **Step 1: Create `package.json` (dependencies are added by npm in Step 3)**

```json
{
  "name": "portafolio",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "media": "bash scripts/build-hero-media.sh"
  }
}
```

- [ ] **Step 2: Create config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL at deploy time (e.g. https://example.dev). Without it canonical/hreflang/sitemap are omitted.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  integrations: site ? [sitemap()] : [],
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

`.gitignore`:
```
node_modules
dist
.astro
.env
*.log
```

- [ ] **Step 3: Install dependencies**

Run:
```bash
cd ~/Proyectos/Portafolio
npm install astro@^6.1.9 tailwindcss@^4.2.4 @tailwindcss/vite@^4.2.4 gsap@^3.15.0 @astrojs/sitemap@^3.7.2 sharp @fontsource/instrument-serif @fontsource-variable/dm-sans @fontsource/jetbrains-mono
npm install -D @astrojs/check typescript vitest
```
Expected: installs without errors (peer warnings are acceptable).

- [ ] **Step 4: Create `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource/instrument-serif/400.css";
@import "@fontsource-variable/dm-sans/index.css";
@import "@fontsource/jetbrains-mono/400.css";

@theme {
  --color-vermilion: #e34234;
  --color-vermilion-deep: #5a1409;
  --color-vermilion-vivid: #d63a22;
  --color-ink: #14090b;
  --color-bone: #f3e9e4;
  --color-amber: #ffb347;
  --font-display: "Instrument Serif", "Times New Roman", serif;
  --font-body: "DM Sans Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --ease-soft: cubic-bezier(0.4, 0, 0.2, 1);
}

html { scroll-behavior: smooth; background: var(--color-ink); }
body {
  background: var(--color-ink);
  color: var(--color-bone);
  font-family: var(--font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 400; line-height: 1.05; }
:focus-visible { outline: 2px solid var(--color-amber); outline-offset: 3px; }

.kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-amber);
}

.btn-primary, .btn-ghost {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: 44px; padding: 0.6rem 1.4rem; border-radius: 999px;
  font-weight: 500; transition: transform .3s var(--ease-soft), background-color .3s var(--ease-soft);
}
.btn-primary { background: var(--color-bone); color: var(--color-ink); }
.btn-primary:hover { transform: translateY(-2px); background: #fff; }
.btn-ghost { color: var(--color-bone); border: 1px solid rgb(243 233 228 / 0.35); }
.btn-ghost:hover { border-color: var(--color-amber); }

.nav-link { position: relative; font-size: 0.95rem; color: rgb(243 233 228 / 0.85); }
.nav-link::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 1px;
  background: var(--color-amber); transform: scaleX(0); transition: transform .3s var(--ease-soft);
}
.nav-link:hover::after, .nav-link:focus-visible::after { transform: scaleX(1); }

/* Motion guards: hidden only when JS is running and motion is allowed; `show` is added by main.ts (or a 2.5s fallback). */
@media (prefers-reduced-motion: no-preference) {
  .js:not(.show) [data-in], .js:not(.show) [data-reveal] { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

.cursor-ring {
  position: fixed; left: -14px; top: -14px; width: 28px; height: 28px; z-index: 50;
  border: 1px solid rgb(243 233 228 / 0.7); border-radius: 999px; pointer-events: none;
  opacity: 0; mix-blend-mode: difference; transition: width .25s, height .25s, margin .25s, opacity .25s;
}
.cursor-ring.is-active { width: 48px; height: 48px; margin: -10px 0 0 -10px; }
```

- [ ] **Step 4b: Create the temporary root page `src/pages/index.astro`**

```astro
---
import '../styles/global.css';
---
<html lang="es"><head><meta charset="utf-8" /><title>Portafolio</title></head>
<body><h1 class="font-display text-5xl uppercase">Portafolio</h1></body></html>
```

- [ ] **Step 5: Verify build and tests runner**

Run: `npm run build`
Expected: `astro check` reports 0 errors and `astro build` completes ("Complete!").
Run: `npx vitest run --passWithNoTests`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 6 + Tailwind 4 + Vitest with design tokens" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Typed i18n dictionaries, site data and parity test

**Files:**
- Create: `src/i18n/types.ts`, `src/i18n/es.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`, `src/data/site.ts`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Produces: `type Lang = 'es' | 'en'`; `interface Dict` (fields below); `dicts: Record<Lang, Dict>`; `otherLang(l: Lang): Lang`; `site` (`name`, `email`, `github`, `linkedin`, `cv: Record<Lang,string>`, `projectLinks: Record<ProjectId,string>`).

- [ ] **Step 1: Write the failing test `tests/i18n.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { es } from '../src/i18n/es';
import { en } from '../src/i18n/en';

// Replace every string with "s" so only the structure (keys, array lengths) is compared.
const shape = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(shape) : v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]))
    : 's';

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings)
    : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

describe('i18n dictionaries', () => {
  it('es and en have the same structure', () => {
    expect(shape(es)).toEqual(shape(en));
  });
  it('has no empty strings and no placeholder text', () => {
    for (const s of [...strings(es), ...strings(en)]) {
      expect(s.trim().length).toBeGreaterThan(0);
      expect(s).not.toMatch(/lorem|todo|tbd/i);
    }
  });
  it('es and en differ where copy is prose (not a copied dictionary)', () => {
    expect(es.hero.sub).not.toBe(en.hero.sub);
    expect(es.whatIDo.problem).not.toBe(en.whatIDo.problem);
  });
  it('featured projects use the three known ids in order', () => {
    expect(es.work.featured.map((p) => p.id)).toEqual(['mikha', 'graphrag', 'semantic']);
    expect(en.work.featured.map((p) => p.id)).toEqual(['mikha', 'graphrag', 'semantic']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/i18n.test.ts`
Expected: FAIL — cannot resolve `../src/i18n/es`.

- [ ] **Step 3: Create `src/i18n/types.ts`**

```ts
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
}
```

- [ ] **Step 4: Create `src/i18n/en.ts`**

```ts
import type { Dict } from './types';

export const en: Dict = {
  meta: {
    title: 'Johan Mihail Conde Sallo — Junior AI Engineer',
    description: 'Junior AI Engineer building LLM agents and RAG systems with tool-calling, evals and full observability. Cusco, Peru (remote).',
    ogAlt: 'Marble bust with a glowing vermilion nebula: portfolio of Johan Mihail Conde Sallo',
  },
  nav: { aria: 'Main', menu: 'Menu', home: 'Back to top', work: 'Work', experience: 'Experience', about: 'About', contact: 'Contact', switchLabel: 'Cambiar a español' },
  hero: {
    headline: ['From prototype to production', 'reliable, traceable AI'],
    sub: 'Junior AI Engineer building LLM agents and RAG systems with tool-calling, evals and full observability.',
    ctaPrimary: "Let's talk", ctaSecondary: 'See work', cv: 'Download CV',
    mediaAlt: 'Marble bust of Johan Mihail with a glowing vermilion nebula in its hair and neck',
    cards: [
      { id: 'mikha', label: 'Personal AI agent' },
      { id: 'graphrag', label: 'Historical GraphRAG' },
      { id: 'semantic', label: 'Semantic search' },
    ],
  },
  whatIDo: {
    kicker: 'What I do',
    problem: 'Most LLM demos work once. The hard part is making them behave the same way on Tuesday, with sources, limits and a trace of every decision.',
    benefits: [
      { title: 'Agents with guardrails', body: 'Read-only tool-calling and actions that need explicit confirmation before they run.' },
      { title: 'Answers with sources', body: 'GraphRAG over colonial archives, with citations and a document preview for every answer.' },
      { title: 'Observability and evals', body: 'OpenTelemetry traces to Phoenix and evaluations to choose the model with evidence.' },
    ],
  },
  work: {
    kicker: 'Selected work',
    featured: [
      { id: 'mikha', title: 'Asistente Mikha', year: '2026', tags: ['FastAPI', 'PydanticAI', 'Ollama', 'OpenTelemetry', 'Phoenix'],
        summary: 'A personal agent on a local LLM (Ollama): read-only tool-calling, actions gated behind explicit confirmation, persistent memory over Markdown notes and OpenTelemetry traces to Phoenix. In the phase 5 evals, qwen3:8b was the only model to get every tool-calling case right.' },
      { id: 'graphrag', title: 'GraphRAG — Historical Assistant', year: '2025', tags: ['GraphRAG', 'LanceDB', 'Next.js', 'AWS Lambda', 'Vercel'],
        summary: 'RAG pipeline with Microsoft GraphRAG and LanceDB over Peruvian colonial archives. Next.js frontend with citable sources and document preview, deployed on AWS Lambda and Vercel.' },
      { id: 'semantic', title: 'Semantic Search', year: '2025', tags: ['FastAPI', 'Qdrant', 'Next.js', 'Embeddings'],
        summary: 'Full-stack RAG app with dual embedding support (OpenAI and open-source) and a custom chunking pipeline that respects sentence boundaries.' },
    ],
    viewCode: 'View code',
    moreTitle: 'More projects',
    more: [
      { title: 'Yuyana', body: 'Peer-to-peer loan and debt tracker (Flutter + Rust). Selected for the Paqarina Wasi pre-incubation program, March 2026.' },
      { title: 'Client sites at Turix', body: 'Next.js and Astro frontends for Magic Experiences Peru, Perou Magique Tours, Kusikuy Travel Transportes and a tour-operator SaaS.' },
    ],
  },
  experience: {
    kicker: 'Experience',
    jobs: [
      { role: 'Frontend & Project Management Intern', org: 'Turix', period: 'Dec 2025 – Aug 2026', place: 'Cusco, Peru (remote)',
        bullets: ['Built Next.js and Astro frontends for real clients in a remote, agile team.', 'Coordinated tasks in Trello and gathered technical requirements directly with clients.'] },
      { role: 'Research Assistant', org: 'LAAD, UNSAAC', period: '2023 – 2025', place: 'Cusco, Peru',
        bullets: ['Built the Next.js frontend of the "Conflicto de Tinta" historical RAG assistant, on top of a RAG backend deployed on AWS Lambda.', 'Contributed to computer vision and NLP work: OCR, data cleaning and labeling, Python pipeline automation.', 'Built the lab website (2023).'] },
    ],
  },
  about: {
    kicker: 'About',
    profile: 'Software engineering graduate at UNSAAC (coursework complete, degree in progress). I build AI systems end to end and study LLM internals (attention, RoPE, SwiGLU) so I can debug them with real technical judgment.',
    stackTitle: 'Stack',
    stack: ['Python', 'PyTorch', 'Ollama', 'PydanticAI', 'RAG', 'Qdrant', 'LanceDB / GraphRAG', 'Prompt engineering', 'Fine-tuning / LoRA', 'FastAPI', 'OpenTelemetry', 'Next.js', 'AWS Lambda', 'Docker', 'SQL', 'Git / GitHub'],
    eventsTitle: 'Events',
    events: [
      { title: 'NASA Space Apps Challenge 2025', body: "Official participant in NASA's global hackathon." },
      { title: 'Paqarina Wasi Incubator (UNSAAC)', body: 'Pre-incubation with Yuyana, March 2026.' },
    ],
    languagesTitle: 'Languages',
    languages: ['Spanish (native)', 'English (B1, technical)', 'Quechua (basic)'],
  },
  contact: {
    kicker: 'Contact',
    title: "Let's build something reliable.",
    body: "I'm looking for a Junior AI Engineer role where I can take LLM prototypes into reliable systems.",
    cta: "Let's talk", location: 'Cusco, Peru (remote)',
  },
  footer: { rights: 'All rights reserved.' },
};
```

- [ ] **Step 5: Create `src/i18n/es.ts`**

```ts
import type { Dict } from './types';

export const es: Dict = {
  meta: {
    title: 'Johan Mihail Conde Sallo — AI Engineer junior',
    description: 'AI Engineer junior. Construyo agentes LLM y sistemas RAG con tool-calling, evaluación y trazabilidad completa. Cusco, Perú (remoto).',
    ogAlt: 'Busto de mármol con una nebulosa bermellón: portafolio de Johan Mihail Conde Sallo',
  },
  nav: { aria: 'Principal', menu: 'Menú', home: 'Volver al inicio', work: 'Proyectos', experience: 'Experiencia', about: 'Sobre mí', contact: 'Contacto', switchLabel: 'Switch to English' },
  hero: {
    headline: ['Del prototipo a producción', 'IA confiable y trazable'],
    sub: 'AI Engineer junior. Construyo agentes LLM y sistemas RAG con tool-calling, evaluación y trazabilidad completa.',
    ctaPrimary: 'Hablemos', ctaSecondary: 'Ver proyectos', cv: 'Descargar CV',
    mediaAlt: 'Busto de mármol de Johan Mihail con una nebulosa bermellón brillando en el cabello y el cuello',
    cards: [
      { id: 'mikha', label: 'Agente de IA personal' },
      { id: 'graphrag', label: 'GraphRAG histórico' },
      { id: 'semantic', label: 'Búsqueda semántica' },
    ],
  },
  whatIDo: {
    kicker: 'Qué hago',
    problem: 'La mayoría de las demos LLM funcionan una vez. Lo difícil es que se comporten igual el martes: con fuentes, límites y traza de cada decisión.',
    benefits: [
      { title: 'Agentes con control', body: 'Tool-calling de solo lectura y acciones que exigen confirmación explícita antes de ejecutarse.' },
      { title: 'Respuestas con fuentes', body: 'GraphRAG sobre archivos coloniales, con citas y vista previa del documento en cada respuesta.' },
      { title: 'Observabilidad y evals', body: 'Trazas OpenTelemetry hacia Phoenix y evaluaciones para elegir el modelo con evidencia.' },
    ],
  },
  work: {
    kicker: 'Proyectos destacados',
    featured: [
      { id: 'mikha', title: 'Asistente Mikha', year: '2026', tags: ['FastAPI', 'PydanticAI', 'Ollama', 'OpenTelemetry', 'Phoenix'],
        summary: 'Agente personal sobre un LLM local (Ollama): tool-calling de solo lectura, acciones con confirmación explícita, memoria persistente sobre notas Markdown y trazas OpenTelemetry hacia Phoenix. En las evals de la fase 5, qwen3:8b fue el único modelo que acertó todos los casos de tool-calling.' },
      { id: 'graphrag', title: 'GraphRAG — Asistente histórico', year: '2025', tags: ['GraphRAG', 'LanceDB', 'Next.js', 'AWS Lambda', 'Vercel'],
        summary: 'Pipeline RAG con Microsoft GraphRAG y LanceDB sobre archivos coloniales peruanos. Frontend en Next.js con fuentes citables y vista previa de documentos, desplegado en AWS Lambda y Vercel.' },
      { id: 'semantic', title: 'Búsqueda semántica', year: '2025', tags: ['FastAPI', 'Qdrant', 'Next.js', 'Embeddings'],
        summary: 'App RAG full-stack con doble soporte de embeddings (OpenAI y open-source) y un chunking propio que respeta los límites de las oraciones.' },
    ],
    viewCode: 'Ver código',
    moreTitle: 'Más proyectos',
    more: [
      { title: 'Yuyana', body: 'Registro de préstamos y deudas entre personas (Flutter + Rust). Seleccionada para la pre-incubación de Paqarina Wasi, marzo de 2026.' },
      { title: 'Sitios de clientes en Turix', body: 'Frontends en Next.js y Astro para Magic Experiences Peru, Perou Magique Tours, Kusikuy Travel Transportes y un SaaS para tour operadores.' },
    ],
  },
  experience: {
    kicker: 'Experiencia',
    jobs: [
      { role: 'Practicante de Frontend y Gestión de Proyectos', org: 'Turix', period: 'dic 2025 – ago 2026', place: 'Cusco, Perú (remoto)',
        bullets: ['Desarrollé frontends en Next.js y Astro para clientes reales en un equipo remoto y ágil.', 'Coordiné tareas en Trello y levanté requisitos técnicos directamente con los clientes.'] },
      { role: 'Asistente de investigación', org: 'LAAD, UNSAAC', period: '2023 – 2025', place: 'Cusco, Perú',
        bullets: ['Construí el frontend en Next.js del asistente histórico RAG "Conflicto de Tinta", sobre un backend RAG desplegado en AWS Lambda.', 'Contribuí en visión por computador y NLP: OCR, limpieza y etiquetado de datos, automatización de pipelines en Python.', 'Desarrollé el sitio web del laboratorio (2023).'] },
    ],
  },
  about: {
    kicker: 'Sobre mí',
    profile: 'Egresado de Ingeniería Informática y de Sistemas en la UNSAAC (bachillerato en trámite). Construyo sistemas de IA de punta a punta y estudio cómo funcionan los LLM por dentro (atención, RoPE, SwiGLU) para depurarlos con criterio técnico.',
    stackTitle: 'Stack',
    stack: ['Python', 'PyTorch', 'Ollama', 'PydanticAI', 'RAG', 'Qdrant', 'LanceDB / GraphRAG', 'Prompt engineering', 'Fine-tuning / LoRA', 'FastAPI', 'OpenTelemetry', 'Next.js', 'AWS Lambda', 'Docker', 'SQL', 'Git / GitHub'],
    eventsTitle: 'Eventos',
    events: [
      { title: 'NASA Space Apps Challenge 2025', body: 'Participante oficial en el hackathon global de la NASA.' },
      { title: 'Incubadora Paqarina Wasi (UNSAAC)', body: 'Pre-incubación con Yuyana, marzo de 2026.' },
    ],
    languagesTitle: 'Idiomas',
    languages: ['Español (nativo)', 'Inglés (B1, técnico)', 'Quechua (básico)'],
  },
  contact: {
    kicker: 'Contacto',
    title: 'Construyamos algo confiable.',
    body: 'Busco un puesto de AI Engineer junior donde pueda llevar prototipos LLM a sistemas confiables.',
    cta: 'Hablemos', location: 'Cusco, Perú (remoto)',
  },
  footer: { rights: 'Todos los derechos reservados.' },
};
```

- [ ] **Step 6: Create `src/i18n/index.ts` and `src/data/site.ts`**

`src/i18n/index.ts`:
```ts
import { en } from './en';
import { es } from './es';
import type { Dict, Lang } from './types';

export type { Dict, Lang, ProjectId } from './types';
export const dicts: Record<Lang, Dict> = { es, en };
export const otherLang = (l: Lang): Lang => (l === 'es' ? 'en' : 'es');
```

`src/data/site.ts`:
```ts
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
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/i18n.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: typed ES/EN dictionaries and site data with parity test" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Base layout, SEO, language routing and page shell

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Page.astro`, `src/pages/es/index.astro`, `src/pages/en/index.astro`, `public/favicon.svg`
- Modify: `src/pages/index.astro` (replace the temporary page with a language-detecting redirect)

**Interfaces:**
- Consumes: `dicts`, `Lang`, `Dict` (Task 2); `site` (Task 2).
- Produces: `<Base lang meta>` with named slot `head` and default slot; `<Page lang>` composing the whole page (later tasks add sections to it); routes `/`, `/es/`, `/en/`.

- [ ] **Step 1: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14090b"/><text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#e34234">JM</text></svg>
```

- [ ] **Step 2: Create `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import { site } from '../data/site';
import type { Lang } from '../i18n/types';

interface Props { lang: Lang; meta: { title: string; description: string; ogAlt: string } }
const { lang, meta } = Astro.props;
const other: Lang = lang === 'es' ? 'en' : 'es';
// Absolute URLs only exist when SITE_URL is set at build time.
const abs = (p: string) => (Astro.site ? new URL(p, Astro.site).href : undefined);
const canonical = abs(`/${lang}/`);
const ogImage = abs('/og.jpg');
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: 'Junior AI Engineer',
  email: site.email,
  sameAs: [site.github, site.linkedin],
  address: { '@type': 'PostalAddress', addressLocality: 'Cusco', addressCountry: 'PE' },
};
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{meta.title}</title>
    <meta name="description" content={meta.description} />
    <meta name="theme-color" content="#14090B" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    {canonical && <link rel="canonical" href={canonical} />}
    {canonical && <link rel="alternate" hreflang={lang} href={canonical} />}
    {abs(`/${other}/`) && <link rel="alternate" hreflang={other} href={abs(`/${other}/`)} />}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={meta.title} />
    <meta property="og:description" content={meta.description} />
    <meta property="og:locale" content={lang === 'es' ? 'es_PE' : 'en_US'} />
    {ogImage && <meta property="og:image" content={ogImage} />}
    {ogImage && <meta property="og:image:alt" content={meta.ogAlt} />}
    <meta name="twitter:card" content="summary_large_image" />
    <script is:inline>
      document.documentElement.classList.add('js');
      setTimeout(function () { document.documentElement.classList.add('show'); }, 2500);
    </script>
    <slot name="head" />
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <slot />
    <div class="cursor-ring" data-cursor aria-hidden="true"></div>
  </body>
</html>
```

- [ ] **Step 3: Create `src/components/Page.astro` (shell; later tasks add sections)**

```astro
---
import Base from '../layouts/Base.astro';
import { dicts } from '../i18n';
import type { Lang } from '../i18n/types';

interface Props { lang: Lang }
const { lang } = Astro.props;
const d = dicts[lang];
---
<Base lang={lang} meta={d.meta}>
  <main id="top">
    <h1 class="font-display text-5xl uppercase">{d.hero.headline.join(' — ')}</h1>
  </main>
</Base>
```

- [ ] **Step 4: Create the language pages and the root redirect**

`src/pages/es/index.astro`:
```astro
---
import Page from '../../components/Page.astro';
---
<Page lang="es" />
```

`src/pages/en/index.astro`:
```astro
---
import Page from '../../components/Page.astro';
---
<Page lang="en" />
```

`src/pages/index.astro` (replace entire file):
```astro
---
---
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Johan Mihail Conde Sallo</title>
    <meta name="robots" content="noindex" />
    <noscript><meta http-equiv="refresh" content="0; url=/es/" /></noscript>
    <script is:inline>
      var l = ((navigator.languages && navigator.languages[0]) || navigator.language || 'es').toLowerCase();
      location.replace(l.indexOf('en') === 0 ? '/en/' : '/es/');
    </script>
  </head>
  <body style="background:#14090b;color:#f3e9e4;font-family:system-ui;padding:2rem">
    <a href="/es/" style="color:#ffb347">Español</a> · <a href="/en/" style="color:#ffb347">English</a>
  </body>
</html>
```

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: 0 errors; `dist/es/index.html`, `dist/en/index.html`, `dist/index.html` exist (`ls dist dist/es dist/en`).
Run: `grep -o '<html lang="[a-z]*"' dist/es/index.html dist/en/index.html`
Expected: `lang="es"` in the es file and `lang="en"` in the en file.
Run: `grep -c 'application/ld+json' dist/es/index.html`
Expected: `1`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: base layout with SEO, language pages and root redirect" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Media pipeline (hero loop, poster, OG image, CV, cards folder)

**Files:**
- Create: `scripts/build-hero-media.sh`, `public/media/hero-loop.mp4`, `public/media/hero-loop-720.mp4`, `public/media/poster.jpg`, `public/og.jpg`, `public/cv/CV_AI_Engineer_ES.pdf`, `public/cv/CV_AI_Engineer_EN.pdf`, `src/assets/cards/.gitkeep`

**Interfaces:**
- Produces: URLs `/media/hero-loop.mp4` (≤1600 px wide), `/media/hero-loop-720.mp4` (1280 px wide), `/media/poster.jpg` (first frame of the video), `/og.jpg` (1200×630), `/cv/CV_AI_Engineer_{ES,EN}.pdf`.

- [ ] **Step 1: Create `scripts/build-hero-media.sh`**

```bash
#!/usr/bin/env bash
# Builds web media from the sources in assets/hero. Re-run after replacing transition.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/hero/transition.mp4
OUT=public/media
mkdir -p "$OUT"

# Ping-pong: forward + reversed (first reversed frame dropped) so `loop` never shows a cut.
pingpong() { # width crf outfile
  ffmpeg -v error -y -i "$SRC" -filter_complex \
    "[0:v]scale=$1:-2,split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -c:v libx264 -crf "$2" -preset slow -pix_fmt yuv420p -movflags +faststart -an "$3"
}
pingpong 1600 28 "$OUT/hero-loop.mp4"
pingpong 1280 30 "$OUT/hero-loop-720.mp4"

# Poster = first frame of the video, so nothing jumps when playback starts.
ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf scale=1600:-2 -q:v 3 "$OUT/poster.jpg"

# Open Graph image: crop around the bust (right side of the frame), 1200x630.
ffmpeg -v error -y -i assets/hero/image-2.png -vf "crop=1254:658:418:0,scale=1200:630" -q:v 3 public/og.jpg

echo "OK"; ls -la "$OUT" public/og.jpg
```

- [ ] **Step 2: Run it**

Run:
```bash
bash scripts/build-hero-media.sh
```
Expected: prints `OK` and lists the four files.

- [ ] **Step 3: Verify durations and sizes**

Run:
```bash
for f in public/media/hero-loop.mp4 public/media/hero-loop-720.mp4; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration,size -of default=nw=1 "$f"; done
```
Expected: `hero-loop.mp4` is 1600×900, duration ≈ 15.9–16.0 s (twice the 8 s source minus one frame); `hero-loop-720.mp4` is 1280×720. `hero-loop.mp4` size ≤ 6000000 bytes and `hero-loop-720.mp4` ≤ 4000000 bytes; if larger, raise the CRF (28→30, 30→32) in the script and re-run.

- [ ] **Step 4: Copy the CVs and create the cards folder**

Run:
```bash
mkdir -p public/cv src/assets/cards
cp ~/Proyectos/Archivo/CV/CVs_Postulacion/CV_AI_Engineer_ES.pdf ~/Proyectos/Archivo/CV/CVs_Postulacion/CV_AI_Engineer_EN.pdf public/cv/
touch src/assets/cards/.gitkeep
ls -la public/cv
```
Expected: both PDFs listed.

- [ ] **Step 5: Visual check of the poster**

Open `public/media/poster.jpg` (Read tool) and confirm: bust on the right, empty dark-red area on the left, face clean marble.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: media pipeline (ping-pong loop, poster, OG image) and CV files" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Pure reveal logic (geometry, blob, config) — TDD

**Files:**
- Create: `src/lib/reveal/geometry.ts`, `src/lib/reveal/blob.ts`, `src/lib/reveal/config.ts`, `src/lib/contrast.ts`
- Test: `tests/geometry.test.ts`, `tests/blob.test.ts`, `tests/contrast.test.ts`

**Interfaces:**
- Produces (`geometry.ts`): `interface Pt {x:number;y:number}`, `interface Rect {x:number;y:number;w:number;h:number}`, `lerp(a,b,k)`, `clamp(v,min,max)`, `clampToRect(p: Pt, r: Rect): Pt`, `coverBox(cw,ch,aspect,posX,posY): Rect`, `mapRect(fraction: Rect, box: Rect): Rect`.
- Produces (`blob.ts`): `blobPoints(cx,cy,rx,ry,t,wobble?=0.12,n?=12): Pt[]`, `closedPath(pts: Pt[]): string`, `blobPath(cx,cy,rx,ry,t,wobble?,n?): string`.
- Produces (`config.ts`): constants `MEDIA_ASPECT, CENTER_ZONE, RADIUS, HIT_AREA, SLATS_AREA, SLAT_WEIGHTS, SLAT_SHIFT_PX, LERP, OPEN_S, PEEK_EVERY_MS, PEEK_HOLD_MS` (fractions of the 16:9 source frame).
- Produces (`contrast.ts`): `luminance(hex)`, `contrast(a,b)`, `blend(fg,bg,alpha)`.

- [ ] **Step 1: Write the failing geometry test `tests/geometry.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { clamp, clampToRect, coverBox, lerp, mapRect } from '../src/lib/reveal/geometry';

describe('geometry', () => {
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(4, 4, 0.9)).toBe(4);
  });
  it('clamp bounds a value', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('clampToRect keeps a point inside the rectangle', () => {
    const r = { x: 10, y: 10, w: 20, h: 10 };
    expect(clampToRect({ x: 0, y: 100 }, r)).toEqual({ x: 10, y: 20 });
    expect(clampToRect({ x: 15, y: 12 }, r)).toEqual({ x: 15, y: 12 });
  });
  it('coverBox of a container with the media aspect fills it exactly', () => {
    expect(coverBox(1600, 900, 16 / 9, 0.5, 0.5)).toEqual({ x: 0, y: 0, w: 1600, h: 900 });
  });
  it('coverBox crops horizontally in a narrow container and honours object-position', () => {
    // 500x500 container, 2:1 media: scale by height -> 1000x500 drawn, right-aligned (posX=1)
    expect(coverBox(500, 500, 2, 1, 0.5)).toEqual({ x: -500, y: 0, w: 1000, h: 500 });
    expect(coverBox(500, 500, 2, 0, 0.5)).toEqual({ x: 0, y: 0, w: 1000, h: 500 });
  });
  it('mapRect converts frame fractions into container pixels', () => {
    const box = { x: -500, y: 0, w: 1000, h: 500 };
    expect(mapRect({ x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, box)).toEqual({ x: 0, y: 250, w: 100, h: 50 });
  });
});
```

- [ ] **Step 2: Write the failing blob test `tests/blob.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { blobPath, blobPoints, closedPath } from '../src/lib/reveal/blob';

describe('blob', () => {
  it('with wobble 0 the points lie exactly on the ellipse', () => {
    const pts = blobPoints(100, 50, 40, 20, 3.7, 0, 12);
    expect(pts).toHaveLength(12);
    expect(pts[0].x).toBeCloseTo(140);
    expect(pts[0].y).toBeCloseTo(50);
    for (const p of pts) {
      const n = ((p.x - 100) / 40) ** 2 + ((p.y - 50) / 20) ** 2;
      expect(n).toBeCloseTo(1);
    }
  });
  it('wobble keeps every point within ±wobble of the base ellipse', () => {
    const w = 0.12;
    for (const t of [0, 1.3, 7.9, 42]) {
      for (const p of blobPoints(0, 0, 100, 60, t, w, 12)) {
        const r = Math.sqrt((p.x / 100) ** 2 + (p.y / 60) ** 2);
        expect(r).toBeGreaterThanOrEqual(1 - w - 1e-9);
        expect(r).toBeLessThanOrEqual(1 + w + 1e-9);
      }
    }
  });
  it('closedPath builds one cubic segment per point and closes', () => {
    const d = closedPath(blobPoints(0, 0, 10, 10, 0, 0, 8));
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(8);
  });
  it('a zero radius collapses to the centre', () => {
    const d = blobPath(30, 40, 0, 0, 1, 0.12);
    expect(d).toMatch(/^M30\.0 40\.0/);
    expect(d).not.toMatch(/NaN/);
  });
  it('is deterministic for the same inputs', () => {
    expect(blobPath(1, 2, 30, 20, 5)).toBe(blobPath(1, 2, 30, 20, 5));
  });
});
```

- [ ] **Step 3: Write the failing contrast test `tests/contrast.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { blend, contrast } from '../src/lib/contrast';

const T = { ink: '#14090B', bone: '#F3E9E4', deep: '#5A1409', vermilion: '#E34234', amber: '#FFB347' };

describe('design token contrast (WCAG AA 4.5:1 for normal text)', () => {
  const pairs: [string, string, string][] = [
    ['bone on ink', T.bone, T.ink],
    ['bone on vermilion-deep (hero copy)', T.bone, T.deep],
    ['bone 72% on vermilion-deep (secondary hero text)', blend(T.bone, T.deep, 0.72), T.deep],
    ['ink on bone (primary button)', T.ink, T.bone],
    ['ink on vermilion', T.ink, T.vermilion],
    ['amber on ink (kickers, arrows)', T.amber, T.ink],
    ['amber on vermilion-deep', T.amber, T.deep],
    ['bone 72% on ink', blend(T.bone, T.ink, 0.72), T.ink],
  ];
  for (const [name, fg, bg] of pairs) {
    it(name, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5));
  }
  it('documents why vermilion-vivid never carries text', () => {
    expect(contrast(T.ink, '#D63A22')).toBeLessThan(4.5);
  });
});
```

- [ ] **Step 4: Run to verify they fail**

Run: `npx vitest run`
Expected: FAIL — modules `geometry`, `blob`, `contrast` cannot be resolved.

- [ ] **Step 5: Implement `src/lib/reveal/geometry.ts`**

```ts
export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function clampToRect(p: Pt, r: Rect): Pt {
  return { x: clamp(p.x, r.x, r.x + r.w), y: clamp(p.y, r.y, r.y + r.h) };
}

/**
 * Where an `object-fit: cover` media of `aspect` (width/height) is drawn inside a cw×ch container.
 * posX/posY are `object-position` fractions (0..1).
 */
export function coverBox(cw: number, ch: number, aspect: number, posX: number, posY: number): Rect {
  const scale = Math.max(cw / aspect, ch); // px per unit of media height
  const w = aspect * scale;
  const h = scale;
  return { x: (cw - w) * posX, y: (ch - h) * posY, w, h };
}

/** Converts a rectangle expressed as fractions of the media frame into container pixels. */
export function mapRect(fraction: Rect, box: Rect): Rect {
  return {
    x: box.x + fraction.x * box.w,
    y: box.y + fraction.y * box.h,
    w: fraction.w * box.w,
    h: fraction.h * box.h,
  };
}
```

- [ ] **Step 6: Implement `src/lib/reveal/blob.ts`**

```ts
import type { Pt } from './geometry';

/** Points of a slightly wobbling ellipse; each point's radius factor stays within 1 ± wobble. */
export function blobPoints(cx: number, cy: number, rx: number, ry: number, t: number, wobble = 0.12, n = 12): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wobble * Math.sin(t * 1.3 + i * 1.7) * Math.cos(t * 0.7 + i * 0.9);
    pts.push({ x: cx + Math.cos(a) * rx * w, y: cy + Math.sin(a) * ry * w });
  }
  return pts;
}

const f = (v: number): string => v.toFixed(1);

/** Closed Catmull-Rom spline converted to cubic Béziers (SVG / CSS path() syntax). */
export function closedPath(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return `${d}Z`;
}

export const blobPath = (cx: number, cy: number, rx: number, ry: number, t: number, wobble = 0.12, n = 12): string =>
  closedPath(blobPoints(cx, cy, rx, ry, t, wobble, n));
```

- [ ] **Step 7: Implement `src/lib/reveal/config.ts`**

```ts
import type { Rect } from './geometry';

/** Every rectangle is a fraction of the 16:9 source frame (measured on assets/hero/image-1.png, 1672×941). */
export const MEDIA_ASPECT = 16 / 9;
/** Region the window's centre may travel in: eyes and brow. */
export const CENTER_ZONE: Rect = { x: 0.7, y: 0.285, w: 0.07, h: 0.06 };
/** Max blob radii as fractions of the frame WIDTH (both axes), so the shape keeps its proportions. */
export const RADIUS = { rx: 0.075, ry: 0.04 };
/** Pointer hit area: the face. */
export const HIT_AREA: Rect = { x: 0.62, y: 0.12, w: 0.21, h: 0.46 };
/** Area covered by the glass slats. */
export const SLATS_AREA: Rect = { x: 0.61, y: 0.1, w: 0.23, h: 0.5 };
export const SLAT_WEIGHTS = [1, 1.4, 0.8, 1.6, 1, 1.2];
export const SLAT_SHIFT_PX = 14;
export const LERP = 0.12;
export const OPEN_S = 0.6;
export const PEEK_EVERY_MS = 6000;
export const PEEK_HOLD_MS = 1500;
```

- [ ] **Step 8: Implement `src/lib/contrast.ts`**

```ts
const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `fg` at `alpha` opacity over `bg`, as a hex colour. */
export function blend(fg: string, bg: string, alpha: number): string {
  const [f, b] = [rgb(fg), rgb(bg)];
  const mix = f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)));
  return `#${mix.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
```

- [ ] **Step 9: Run all tests**

Run: `npx vitest run`
Expected: PASS (i18n 4, geometry 6, blob 5, contrast 9). If a contrast pair fails, adjust the token in `global.css`, the `T` map and the spec together, then re-run.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: pure reveal geometry/blob math and contrast guard with tests" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Nav, hero layout, cards and ambient video

**Files:**
- Create: `src/components/Nav.astro`, `src/components/HeroCards.astro`, `src/components/Hero.astro`, `src/scripts/hero-video.ts`, `src/scripts/hero.ts`
- Modify: `src/components/Page.astro`

**Interfaces:**
- Consumes: `Dict`, `Lang`, `otherLang` (Task 2), `site` (Task 2), media URLs (Task 4).
- Produces: `<Hero lang d>`; the DOM contract used by Task 7: `[data-hero-media]` (positioned container, `role="img"`), `video[data-hero-video]` inside it, CSS `object-position` on the video; `[data-in]` attributes on hero elements (Task 9); `initHeroVideo(video: HTMLVideoElement): void`.

- [ ] **Step 1: Create `src/components/Nav.astro`**

```astro
---
import { otherLang } from '../i18n';
import type { Dict, Lang } from '../i18n/types';

interface Props { lang: Lang; d: Dict }
const { lang, d } = Astro.props;
const other = otherLang(lang);
const links = [
  ['work', d.nav.work],
  ['experience', d.nav.experience],
  ['about', d.nav.about],
  ['contact', d.nav.contact],
] as const;
---
<header class="flex items-center justify-between px-5 pt-5 md:px-10 md:pt-8" data-in>
  <a href="#top" class="font-display text-3xl leading-none text-bone" aria-label={d.nav.home}>JM</a>
  <nav aria-label={d.nav.aria} class="hidden gap-8 md:flex">
    {links.map(([id, label]) => <a class="nav-link" href={`#${id}`}>{label}</a>)}
  </nav>
  <div class="flex items-center gap-3">
    <a class="nav-link inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-sm" href={`/${other}/`} hreflang={other} lang={other} aria-label={d.nav.switchLabel}>{other.toUpperCase()}</a>
    <details class="relative md:hidden">
      <summary class="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full border border-bone/35 px-4 text-sm">{d.nav.menu}</summary>
      <nav aria-label={d.nav.aria} class="absolute right-0 top-12 z-20 grid min-w-44 gap-1 rounded-2xl bg-ink/95 p-3 backdrop-blur">
        {links.map(([id, label]) => <a class="rounded-lg px-3 py-3 text-bone" href={`#${id}`}>{label}</a>)}
      </nav>
    </details>
  </div>
</header>
```

- [ ] **Step 2: Create `src/components/HeroCards.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;

// Card images are generated by the user (a = mikha, b = graphrag, c = semantic); a fallback tile is used until they exist.
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/cards/*.{png,jpg,jpeg,webp}', { eager: true });
const fileFor = (letter: string) =>
  Object.entries(files).find(([path]) => (path.split('/').pop() ?? '').startsWith(`${letter}.`))?.[1].default;
const letters = ['a', 'b', 'c'];
---
<ul class="hero-cards" data-in>
  {d.hero.cards.map((c, i) => {
    const img = fileFor(letters[i]);
    return (
      <li>
        <a href={`#work-${c.id}`} class="hero-card">
          {img ? <Image src={img} alt="" width={240} height={300} class="hero-card-img" loading="eager" /> : <span class="hero-card-img hero-card-fallback" />}
          <span class="hero-card-label">{c.label}</span>
        </a>
      </li>
    );
  })}
</ul>

<style>
  .hero-cards { display: flex; gap: 0.75rem; padding: 0; margin: 0; list-style: none; pointer-events: auto; }
  .hero-card { position: relative; display: block; width: clamp(96px, 10.5vw, 150px); aspect-ratio: 4 / 5; overflow: hidden; border-radius: 14px; }
  .hero-card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease-soft); }
  .hero-card-fallback { background: linear-gradient(160deg, #8c2210, #d63a22); }
  .hero-card:hover .hero-card-img { transform: scale(1.05); }
  .hero-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(20 9 11 / .65), transparent 55%); }
  .hero-card-label {
    position: absolute; z-index: 1; right: 0.6rem; bottom: 0.55rem; left: 0.6rem; text-align: right;
    font-family: var(--font-display); text-transform: uppercase; line-height: 0.95; color: var(--color-bone);
    font-size: clamp(0.8rem, 1.1vw, 1.05rem);
  }
  @media (max-width: 767px) { .hero-cards { overflow-x: auto; padding-bottom: 0.25rem; } .hero-card { flex: none; } }
</style>
```

- [ ] **Step 3: Create `src/scripts/hero-video.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/scripts/hero.ts`**

```ts
import { initHeroVideo } from './hero-video';

const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (video) initHeroVideo(video);
```

- [ ] **Step 5: Create `src/components/Hero.astro`**

```astro
---
import { site } from '../data/site';
import type { Dict, Lang } from '../i18n/types';
import HeroCards from './HeroCards.astro';
import Nav from './Nav.astro';

interface Props { lang: Lang; d: Dict }
const { lang, d } = Astro.props;
---
<section class="hero" aria-labelledby="hero-title" data-hero>
  <div class="hero-media" data-hero-media role="img" aria-label={d.hero.mediaAlt}>
    <video
      class="hero-video" poster="/media/poster.jpg" muted playsinline loop preload="none" aria-hidden="true"
      data-hero-video data-src-desktop="/media/hero-loop.mp4" data-src-mobile="/media/hero-loop-720.mp4"
    ></video>
  </div>

  <div class="hero-inner">
    <Nav lang={lang} d={d} />
    <div class="hero-copy">
      <h1 id="hero-title" class="hero-title" data-in>
        <span class="block">{d.hero.headline[0]}</span>
        <span class="block">— {d.hero.headline[1]}</span>
      </h1>
      <p class="hero-sub" data-in>{d.hero.sub}</p>
      <div class="hero-cta" data-in>
        <a class="btn-primary" href={`mailto:${site.email}`}>{d.hero.ctaPrimary}</a>
        <a class="btn-ghost" href="#work">{d.hero.ctaSecondary} <span aria-hidden="true" class="text-amber">→</span></a>
        <a class="btn-ghost" href={site.cv[lang]} download>{d.hero.cv}</a>
      </div>
    </div>
    <HeroCards d={d} />
  </div>
</section>

<script>
  import '../scripts/hero';
</script>

<style>
  .hero {
    position: relative; isolation: isolate; overflow: hidden; border-radius: 24px;
    margin: 1rem 1rem 0; min-height: 640px; aspect-ratio: 16 / 9;
    background: linear-gradient(115deg, #5a1409 0%, #7c1c10 38%, #d63a22 100%);
  }
  .hero-media { position: absolute; inset: 0; z-index: 0; }
  .hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 100% 50%; background: transparent; }
  /* The inner layer never blocks the pointer; only interactive children opt back in. */
  .hero-inner { position: relative; z-index: 2; display: flex; flex-direction: column; min-height: inherit; height: 100%; padding-bottom: clamp(1.25rem, 3vw, 2.5rem); pointer-events: none; }
  .hero-inner :global(:is(a, summary, details, ul)) { pointer-events: auto; }
  .hero-copy { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 1.5rem; max-width: 46%; padding: 2rem clamp(1.25rem, 5vw, 4.5rem); }
  .hero-inner > :global(ul) { margin-left: clamp(1.25rem, 5vw, 4.5rem); }
  .hero-title {
    font-size: clamp(2.5rem, 5.2vw, 5.6rem); line-height: 0.95; letter-spacing: -0.01em;
    text-transform: uppercase; color: var(--color-bone);
  }
  .hero-sub { max-width: 34ch; font-size: clamp(1rem, 1.25vw, 1.2rem); color: rgb(243 233 228 / 0.72); }
  .hero-cta { display: flex; flex-wrap: wrap; gap: 0.75rem; pointer-events: auto; }
  @media (min-width: 768px) { .hero { margin: 1.5rem 1.5rem 0; } }
  @media (max-width: 767px) {
    .hero { aspect-ratio: auto; min-height: max(calc(100svh - 2rem), 820px); }
    .hero-media { inset: 0 0 auto 0; height: 58%; }
    .hero-media::after { content: ""; position: absolute; inset: auto 0 0 0; height: 45%; background: linear-gradient(to top, #5a1409, transparent); }
    .hero-video { object-position: 85% 50%; }
    .hero-copy { max-width: none; justify-content: flex-end; }
  }
</style>
```

- [ ] **Step 6: Update `src/components/Page.astro` to render the hero**

Replace the whole file with:
```astro
---
import Base from '../layouts/Base.astro';
import { dicts } from '../i18n';
import type { Lang } from '../i18n/types';
import Hero from './Hero.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const d = dicts[lang];
---
<Base lang={lang} meta={d.meta}>
  <link slot="head" rel="preload" as="image" href="/media/poster.jpg" fetchpriority="high" />
  <main id="top">
    <Hero lang={lang} d={d} />
  </main>
</Base>
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev` (leave running; URL `http://localhost:4321/es/`).
Check with the browser tools at 1440×900, then 390×844:
1. Video plays (bust on the right, particles drifting), no console errors, network shows `hero-loop.mp4` (desktop) / `hero-loop-720.mp4` (mobile).
2. Headline, subtext and 3 buttons readable on the dark-red left side; cards fallback tiles visible bottom-left with labels.
3. `/en/` shows English copy; the `EN`/`ES` toggle navigates between them.
4. In devtools emulate `prefers-reduced-motion: reduce`: only the poster shows, no video request.
Fix any layout defect before committing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: hero layout with nav, cards and ambient video loop" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Hover reveal (window over the face, terminal layer, glass slats)

**Files:**
- Create: `src/components/HeroReveal.astro`, `src/scripts/hero-reveal.ts`
- Modify: `src/components/Hero.astro` (mount `<HeroReveal />` inside `[data-hero-media]`), `src/scripts/hero.ts` (call `initHeroReveal`)

**Interfaces:**
- Consumes: `blobPath` (Task 5), `clampToRect`, `coverBox`, `lerp`, `mapRect`, `Pt`, `Rect` (Task 5), all constants in `config.ts` (Task 5); DOM contract from Task 6 (`[data-hero-media]`, `video[data-hero-video]`).
- Produces: `initHeroReveal(media: HTMLElement, video: HTMLVideoElement): void`; markup hooks `[data-reveal-root]`, `[data-reveal-layer]`, `[data-reveal-term]`, `[data-rim]` (an SVG `<path>`), `[data-slats]`, `[data-hit]`.

- [ ] **Step 1: Create `src/components/HeroReveal.astro`**

```astro
---
import { SLAT_WEIGHTS } from '../lib/reveal/config';

// Decorative agent trace shown "under the skin". No timings or counts that could read as real measurements.
const session = [
  '<span class="hr-k">$</span> agent run <span class="hr-d">"what is pending today?"</span>',
  '  <span class="hr-d">├─</span> tool     read_note<span class="hr-d">("Inbox.md")</span>',
  '  <span class="hr-d">├─</span> tool     search_vault<span class="hr-d">("deadlines")</span>',
  '  <span class="hr-d">├─</span> plan     read-only steps',
  '  <span class="hr-d">├─</span> <span class="hr-v">confirm</span>  send_email? <span class="hr-d">[y/N]</span>',
  '  <span class="hr-d">└─</span> trace    <span class="hr-d">→</span> phoenix <span class="hr-d">· span 7f3a9c</span>',
  '<span class="hr-k">$</span> agent run <span class="hr-d">"summarize the archive"</span>',
  '  <span class="hr-d">├─</span> retrieve graph + vectors',
  '  <span class="hr-d">├─</span> rerank   best sources',
  '  <span class="hr-d">├─</span> answer   with citations',
  '  <span class="hr-d">└─</span> trace    <span class="hr-d">→</span> phoenix <span class="hr-d">· span c41e08</span>',
  '',
];
---
<div class="hr-root" data-reveal-root aria-hidden="true">
  <div class="hr-layer" data-reveal-layer>
    <div class="hr-term" data-reveal-term>
      <div class="hr-scroll">
        {[0, 1].map(() => session.map((l) => <div class="hr-line" set:html={l || '&nbsp;'} />))}
      </div>
    </div>
  </div>
  <svg class="hr-rim" data-rim-svg><path data-rim d="" /></svg>
  <div class="hr-slats" data-slats>
    {SLAT_WEIGHTS.map((w) => <i class="hr-slat" style={`flex:${w}`} />)}
  </div>
  <div class="hr-hit" data-hit></div>
</div>

<style is:global>
  .hr-root { position: absolute; inset: 0; z-index: 1; }
  .hr-layer { position: absolute; inset: 0; clip-path: circle(0px); pointer-events: none; will-change: clip-path; }
  .hr-term {
    position: absolute; overflow: hidden; background-color: var(--color-ink);
    background-image: repeating-linear-gradient(0deg, rgb(255 179 71 / 0.06) 0 1px, transparent 1px 3px);
    font-family: var(--font-mono); font-size: clamp(9px, 0.85vw, 12px); line-height: 1.7; color: var(--color-bone);
  }
  .hr-scroll { animation: hr-up 26s linear infinite; }
  @keyframes hr-up { to { transform: translateY(-50%); } }
  .hr-line { white-space: pre; padding: 0 1.2em; }
  .hr-k { color: var(--color-amber); }
  .hr-d { color: rgb(243 233 228 / 0.55); }
  .hr-v { color: #ff6b57; }
  .hr-rim { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  .hr-rim path { fill: none; stroke: var(--color-amber); stroke-width: 2; opacity: 0; filter: drop-shadow(0 0 6px rgb(255 179 71 / 0.55)); }
  .hr-slats { position: absolute; display: flex; pointer-events: none; }
  .hr-slat {
    display: block; border-left: 1px solid rgb(243 233 228 / 0.35); will-change: transform;
    background: linear-gradient(90deg, rgb(243 233 228 / 0.07), transparent 65%);
    backdrop-filter: blur(1.5px) brightness(1.08);
  }
  .hr-slat:last-child { border-right: 1px solid rgb(243 233 228 / 0.35); }
  .hr-hit { position: absolute; touch-action: pan-y; }
  @media (prefers-reduced-motion: reduce) { .hr-scroll { animation: none; } }
</style>
```

- [ ] **Step 2: Create `src/scripts/hero-reveal.ts`**

```ts
import { gsap } from 'gsap';
import { blobPath } from '../lib/reveal/blob';
import * as C from '../lib/reveal/config';
import { clampToRect, coverBox, lerp, mapRect, type Pt, type Rect } from '../lib/reveal/geometry';

const px = (n: number): string => `${n.toFixed(1)}px`;
const place = (el: HTMLElement, r: Rect): void => {
  el.style.left = px(r.x); el.style.top = px(r.y); el.style.width = px(r.w); el.style.height = px(r.h);
};

/** Reads the computed `object-position` of the video as 0..1 fractions. */
function objectPosition(el: HTMLElement): [number, number] {
  const [x = '50%', y = '50%'] = getComputedStyle(el).objectPosition.split(' ');
  const f = (v: string): number => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5);
  return [f(x), f(y)];
}

export function initHeroReveal(media: HTMLElement, video: HTMLVideoElement): void {
  const q = <T extends Element>(s: string): T | null => media.querySelector<T>(s);
  const layer = q<HTMLElement>('[data-reveal-layer]');
  const term = q<HTMLElement>('[data-reveal-term]');
  const rim = q<SVGPathElement>('[data-rim]');
  const slatsEl = q<HTMLElement>('[data-slats]');
  const hit = q<HTMLElement>('[data-hit]');
  if (!layer || !term || !rim || !slatsEl || !hit) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchOnly = matchMedia('(hover: none)').matches;

  let zone: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let hitRect: Rect = zone;
  let radius = { rx: 0, ry: 0 };

  const measure = (): void => {
    const r = media.getBoundingClientRect();
    const [ox, oy] = objectPosition(video);
    const box = coverBox(r.width, r.height, C.MEDIA_ASPECT, ox, oy);
    zone = mapRect(C.CENTER_ZONE, box);
    hitRect = mapRect(C.HIT_AREA, box);
    radius = { rx: C.RADIUS.rx * box.w, ry: C.RADIUS.ry * box.w };
    place(hit, hitRect);
    place(slatsEl, mapRect(C.SLATS_AREA, box));
    // Terminal panel covers everything the blob can reach (zone + radii + 20% wobble margin).
    place(term, {
      x: zone.x - radius.rx * 1.2, y: zone.y - radius.ry * 1.2,
      w: zone.w + radius.rx * 2.4, h: zone.h + radius.ry * 2.4,
    });
  };
  measure();
  new ResizeObserver(measure).observe(media);

  // --- blob state -------------------------------------------------------
  const state = { k: 0 }; // openness 0..1
  const target: Pt = { x: 0, y: 0 };
  const cur: Pt = { x: 0, y: 0 };
  let inside = false;
  let visible = false;
  let raf = 0;
  const t0 = performance.now();

  const draw = (): void => {
    if (state.k < 0.002) {
      layer.style.clipPath = 'circle(0px)';
      rim.setAttribute('d', '');
      return;
    }
    cur.x = lerp(cur.x, target.x, reduce ? 1 : C.LERP);
    cur.y = lerp(cur.y, target.y, reduce ? 1 : C.LERP);
    const t = (performance.now() - t0) / 1000;
    const d = blobPath(cur.x, cur.y, radius.rx * state.k, radius.ry * state.k, t, reduce ? 0 : 0.12);
    layer.style.clipPath = `path("${d}")`;
    rim.setAttribute('d', d);
    rim.style.opacity = String(Math.min(1, state.k * 1.5));
  };
  const tick = (): void => {
    draw();
    raf = state.k > 0.002 || inside ? requestAnimationFrame(tick) : 0;
  };
  const start = (): void => { if (!raf && visible) raf = requestAnimationFrame(tick); };

  let peekTl: gsap.core.Timeline | null = null;
  const openTo = (v: 0 | 1, delay = 0): void => {
    peekTl?.kill();
    peekTl = null;
    if (reduce) { state.k = v; start(); return; }
    gsap.to(state, { k: v, duration: C.OPEN_S, delay, ease: v ? 'power3.out' : 'power2.inOut', overwrite: true, onUpdate: start });
  };

  // --- glass slats ------------------------------------------------------
  const slats = Array.from(slatsEl.children) as HTMLElement[];
  const shift = reduce ? [] : slats.map((s) => gsap.quickTo(s, 'x', { duration: 0.8, ease: 'power3.out' }));
  const moveSlats = (localX: number): void => {
    if (!shift.length) return;
    const n = (localX - hitRect.x) / hitRect.w; // 0..1 across the face
    shift.forEach((to, i) => to((n - 0.5) * 2 * C.SLAT_SHIFT_PX * (i % 2 ? 1 : -1) * (0.5 + i * 0.15)));
  };
  const restSlats = (): void => shift.forEach((to) => to(0));

  // --- pointer (mouse, pen and touch share these events) -----------------
  const local = (e: PointerEvent): Pt => {
    const r = media.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  hit.addEventListener('pointerenter', (e) => {
    inside = true;
    const p = clampToRect(local(e), zone);
    if (state.k < 0.002) { cur.x = p.x; cur.y = p.y; }
    target.x = p.x; target.y = p.y;
    openTo(1);
    start();
  });
  hit.addEventListener('pointermove', (e) => {
    const l = local(e);
    const p = clampToRect(l, zone);
    target.x = p.x; target.y = p.y;
    moveSlats(l.x);
  });
  hit.addEventListener('pointerleave', (e) => {
    inside = false;
    openTo(0, e.pointerType === 'touch' ? 0.9 : 0); // on touch, linger briefly after the finger lifts
    restSlats();
  });

  // --- auto "peek" on touch-only devices ----------------------------------
  if (touchOnly && !reduce) {
    window.setInterval(() => {
      if (!visible || inside || state.k > 0.002) return;
      target.x = cur.x = zone.x + zone.w / 2;
      target.y = cur.y = zone.y + zone.h / 2;
      peekTl = gsap.timeline({ onUpdate: start })
        .to(state, { k: 1, duration: C.OPEN_S, ease: 'power3.out' })
        .to(state, { k: 0, duration: C.OPEN_S, ease: 'power2.inOut' }, `+=${C.PEEK_HOLD_MS / 1000}`);
    }, C.PEEK_EVERY_MS);
  }

  // --- only run while the hero is on screen --------------------------------
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else { inside = false; state.k = 0; draw(); }
  }).observe(media);
}
```

- [ ] **Step 3: Mount it in `Hero.astro`**

Add to the frontmatter imports:
```astro
import HeroReveal from './HeroReveal.astro';
```
and inside `<div class="hero-media" ...>`, right after the closing `</video>`:
```astro
    <HeroReveal />
```

- [ ] **Step 4: Wire it in `src/scripts/hero.ts`**

Replace the file with:
```ts
import { initHeroReveal } from './hero-reveal';
import { initHeroVideo } from './hero-video';

const media = document.querySelector<HTMLElement>('[data-hero-media]');
const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (media && video) {
  initHeroVideo(video);
  initHeroReveal(media, video);
}
```

- [ ] **Step 5: Verify behavior in the browser (dev server)**

At 1440×900 on `/es/`:
1. Move the mouse onto the face: a golden-rimmed organic window opens over the eyes/brow (~0.6 s), showing the dark terminal text scrolling; it follows the pointer smoothly, staying inside the eye/brow zone.
2. Move the pointer out of the face: the window closes with the same easing; no residue (`layer.style.clipPath` is `circle(0px)`).
3. The six glass slats sit over the face and shift slightly as the pointer moves horizontally.
4. Cursor over the headline/buttons does not trigger the reveal, and the buttons remain clickable (the hero-inner has `pointer-events: none` except links).
5. Devtools → emulate `prefers-reduced-motion: reduce`: no video, the window opens instantly, no wobble, terminal text static, slats static.
6. Touch emulation (devtools device toolbar): touching the face opens the window; vertical scrolling from the face still scrolls the page; the window peeks automatically every ~6 s when idle.
7. Console: no errors.

- [ ] **Step 6: Calibrate against the real footage**

Screenshot the open window at 1440 and 390 widths. If the window is not centered on the eyes/brow, or slats/hit area miss the face, adjust only the fractions in `src/lib/reveal/config.ts` (`CENTER_ZONE`, `RADIUS`, `HIT_AREA`, `SLATS_AREA`) using the poster (1600×900 → fractions = px / 1600 and px / 900), reload and re-check. The window edge must never expose the hair or background (keep `RADIUS` within the face width). Re-run `npx vitest run` (config values are not asserted, so tests still pass).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: hover reveal over the bust face with terminal layer and glass slats" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Content sections and footer

**Files:**
- Create: `src/components/WhatIDo.astro`, `src/components/Work.astro`, `src/components/Experience.astro`, `src/components/About.astro`, `src/components/Contact.astro`, `src/components/Footer.astro`
- Modify: `src/components/Page.astro`

**Interfaces:**
- Consumes: `Dict`, `Lang` (Task 2), `site` (Task 2), CSS utilities from Task 1 (`.kicker`, `.btn-primary`, `.btn-ghost`).
- Produces: section ids `work`, `experience`, `about`, `contact` (targets of the nav), article ids `work-mikha|work-graphrag|work-semantic` (targets of the hero cards), `data-reveal` on every animated block (Task 9).

- [ ] **Step 1: Create `src/components/WhatIDo.astro`**

```astro
---
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;
---
<section class="mx-auto max-w-6xl px-4 py-28 md:px-6" aria-labelledby="what-title">
  <h2 id="what-title" class="kicker" data-reveal>{d.whatIDo.kicker}</h2>
  <p class="mt-6 max-w-4xl font-display text-4xl leading-[1.05] md:text-6xl" data-reveal>{d.whatIDo.problem}</p>
  <ol class="mt-16 grid gap-px overflow-hidden rounded-2xl bg-bone/15 md:grid-cols-3">
    {d.whatIDo.benefits.map((b, i) => (
      <li class="bg-ink p-6 md:p-8" data-reveal>
        <span class="font-mono text-sm text-amber">0{i + 1}</span>
        <h3 class="mt-4 font-display text-3xl uppercase">{b.title}</h3>
        <p class="mt-3 text-bone/72">{b.body}</p>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 2: Create `src/components/Work.astro`**

```astro
---
import { site } from '../data/site';
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;
---
<section id="work" class="mx-auto max-w-6xl px-4 py-24 md:px-6" aria-labelledby="work-title">
  <h2 id="work-title" class="kicker" data-reveal>{d.work.kicker}</h2>
  <div class="mt-8">
    {d.work.featured.map((p) => (
      <article id={`work-${p.id}`} class="grid gap-6 border-t border-bone/15 py-10 md:grid-cols-[6rem_1fr_1.2fr] md:gap-10" data-reveal>
        <p class="font-mono text-sm text-amber">{p.year}</p>
        <h3 class="font-display text-4xl uppercase leading-none md:text-5xl">{p.title}</h3>
        <div>
          <p class="text-bone/80">{p.summary}</p>
          <ul class="mt-4 flex flex-wrap gap-2">
            {p.tags.map((t) => <li class="rounded-full border border-bone/20 px-3 py-1 font-mono text-xs">{t}</li>)}
          </ul>
          <a href={site.projectLinks[p.id]} target="_blank" rel="noopener noreferrer" class="mt-6 inline-flex min-h-11 items-center gap-2 text-bone underline decoration-amber decoration-2 underline-offset-8">
            {d.work.viewCode} <span aria-hidden="true" class="text-amber">→</span>
          </a>
        </div>
      </article>
    ))}
  </div>

  <h3 class="mt-16 font-display text-3xl uppercase" data-reveal>{d.work.moreTitle}</h3>
  <div class="mt-6 grid gap-4 md:grid-cols-2">
    {d.work.more.map((m) => (
      <div class="rounded-2xl border border-bone/15 p-6" data-reveal>
        <h4 class="font-display text-2xl uppercase">{m.title}</h4>
        <p class="mt-2 text-bone/72">{m.body}</p>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Create `src/components/Experience.astro`**

```astro
---
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;
---
<section id="experience" class="mx-auto max-w-6xl px-4 py-24 md:px-6" aria-labelledby="exp-title">
  <h2 id="exp-title" class="kicker" data-reveal>{d.experience.kicker}</h2>
  <ol class="mt-8">
    {d.experience.jobs.map((j) => (
      <li class="grid gap-4 border-t border-bone/15 py-10 md:grid-cols-[14rem_1fr] md:gap-10" data-reveal>
        <div>
          <p class="font-mono text-sm text-amber">{j.period}</p>
          <p class="mt-1 text-sm text-bone/72">{j.place}</p>
        </div>
        <div>
          <h3 class="font-display text-3xl uppercase">{j.role}</h3>
          <p class="mt-1 text-bone/80">{j.org}</p>
          <ul class="mt-4 list-disc space-y-2 pl-5 text-bone/80">
            {j.bullets.map((b) => <li>{b}</li>)}
          </ul>
        </div>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 4: Create `src/components/About.astro`**

```astro
---
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;
---
<section id="about" class="mx-auto max-w-6xl px-4 py-24 md:px-6" aria-labelledby="about-title">
  <h2 id="about-title" class="kicker" data-reveal>{d.about.kicker}</h2>
  <p class="mt-6 max-w-3xl font-display text-3xl leading-tight md:text-5xl" data-reveal>{d.about.profile}</p>

  <div class="mt-14 grid gap-12 md:grid-cols-[1.4fr_1fr]">
    <div data-reveal>
      <h3 class="font-display text-2xl uppercase">{d.about.stackTitle}</h3>
      <ul class="mt-4 flex flex-wrap gap-2">
        {d.about.stack.map((s) => <li class="rounded-full border border-bone/20 px-3 py-1 font-mono text-xs">{s}</li>)}
      </ul>
    </div>
    <div class="space-y-10">
      <div data-reveal>
        <h3 class="font-display text-2xl uppercase">{d.about.eventsTitle}</h3>
        <ul class="mt-4 space-y-4">
          {d.about.events.map((e) => (
            <li><p class="text-bone">{e.title}</p><p class="text-sm text-bone/72">{e.body}</p></li>
          ))}
        </ul>
      </div>
      <div data-reveal>
        <h3 class="font-display text-2xl uppercase">{d.about.languagesTitle}</h3>
        <ul class="mt-4 space-y-1 text-bone/80">
          {d.about.languages.map((l) => <li>{l}</li>)}
        </ul>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create `src/components/Contact.astro`**

```astro
---
import { site } from '../data/site';
import type { Dict, Lang } from '../i18n/types';

interface Props { lang: Lang; d: Dict }
const { lang, d } = Astro.props;
---
<section id="contact" class="mx-4 my-24 overflow-hidden rounded-3xl bg-gradient-to-br from-vermilion-deep to-vermilion-vivid md:mx-6" aria-labelledby="contact-title">
  <div class="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
    <h2 id="contact-title" class="kicker" data-reveal>{d.contact.kicker}</h2>
    <p class="mt-6 max-w-4xl font-display text-5xl uppercase leading-[0.98] md:text-8xl" data-reveal>{d.contact.title}</p>
    <p class="mt-6 max-w-xl text-lg text-bone" data-reveal>{d.contact.body}</p>
    <div class="mt-10 flex flex-wrap gap-3" data-reveal>
      <a class="btn-primary" href={`mailto:${site.email}`}>{d.contact.cta}</a>
      <a class="btn-ghost" href={site.cv[lang]} download>{d.hero.cv}</a>
    </div>
    <ul class="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-bone" data-reveal>
      <li><a class="inline-flex min-h-11 items-center underline decoration-amber decoration-2 underline-offset-8" href={`mailto:${site.email}`}>{site.email}</a></li>
      <li><a class="inline-flex min-h-11 items-center underline decoration-amber decoration-2 underline-offset-8" href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
      <li><a class="inline-flex min-h-11 items-center underline decoration-amber decoration-2 underline-offset-8" href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
    </ul>
    <p class="mt-6 text-sm text-bone/80">{d.contact.location}</p>
  </div>
</section>
```

Note: text on this section sits on `vermilion-deep → vermilion-vivid`; the copy is bone on the darker half. If the visual check shows text reaching the vivid corner, add `max-w` limits or a darker overlay so no text sits on `--vermilion-vivid` (Global Constraints).

- [ ] **Step 6: Create `src/components/Footer.astro`**

```astro
---
import { site } from '../data/site';
import type { Dict } from '../i18n/types';

interface Props { d: Dict }
const { d } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="border-t border-bone/15">
  <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-bone/72 md:flex-row md:items-center md:justify-between md:px-6">
    <p>© {year} {site.name}. {d.footer.rights}</p>
    <p>{d.contact.location}</p>
  </div>
</footer>
```

- [ ] **Step 7: Compose them in `src/components/Page.astro`**

Replace the file with:
```astro
---
import Base from '../layouts/Base.astro';
import { dicts } from '../i18n';
import type { Lang } from '../i18n/types';
import About from './About.astro';
import Contact from './Contact.astro';
import Experience from './Experience.astro';
import Footer from './Footer.astro';
import Hero from './Hero.astro';
import WhatIDo from './WhatIDo.astro';
import Work from './Work.astro';

interface Props { lang: Lang }
const { lang } = Astro.props;
const d = dicts[lang];
---
<Base lang={lang} meta={d.meta}>
  <link slot="head" rel="preload" as="image" href="/media/poster.jpg" fetchpriority="high" />
  <main id="top">
    <Hero lang={lang} d={d} />
    <WhatIDo d={d} />
    <Work d={d} />
    <Experience d={d} />
    <About d={d} />
    <Contact lang={lang} d={d} />
  </main>
  <Footer d={d} />
</Base>
```

- [ ] **Step 8: Verify**

Run: `npm run build && npx vitest run`
Expected: build 0 errors; tests pass.
In the browser (dev) at 1440 and 390 on `/es/` and `/en/`: every nav link and hero card scrolls to its section; sections readable, no horizontal scroll at 390 px; only one `h1` (`document.querySelectorAll('h1').length === 1`).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: what I do, work, experience, about, contact and footer sections" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Motion — entrance, scroll reveals, custom cursor

**Files:**
- Create: `src/scripts/entrance.ts`, `src/scripts/scroll.ts`, `src/scripts/cursor.ts`, `src/scripts/main.ts`
- Modify: `src/components/Page.astro` (load `main.ts`)

**Interfaces:**
- Consumes: `[data-in]` (hero, Task 6), `[data-reveal]` (Task 8), `[data-cursor]` (Base, Task 3); the `js`/`show` html classes and the CSS guard from Tasks 1 and 3.
- Produces: `initEntrance(): void`, `initScrollReveals(): void`, `initCursor(): void`; `main.ts` runs all three and adds the `show` class.

- [ ] **Step 1: Create `src/scripts/entrance.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/scripts/scroll.ts`**

```ts
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
```

- [ ] **Step 3: Create `src/scripts/cursor.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/scripts/main.ts` and load it**

`src/scripts/main.ts`:
```ts
import { initCursor } from './cursor';
import { initEntrance } from './entrance';
import { initScrollReveals } from './scroll';

initEntrance();
initScrollReveals();
initCursor();
// Elements that were hidden by the CSS guard are now owned by GSAP (or the user opted out of motion).
document.documentElement.classList.add('show');
```

In `src/components/Page.astro`, add before `</Base>`:
```astro
  <script>
    import '../scripts/main';
  </script>
```

- [ ] **Step 5: Verify**

In the browser (dev), 1440×900:
1. Reload `/es/`: hero nav, title, subtext, buttons and cards fade up in sequence; no flash of unstyled content before the animation.
2. Scroll: each section block fades up once as it enters.
3. Desktop: a thin ring trails the mouse and grows over links/buttons/the face area.
4. Emulate `prefers-reduced-motion: reduce`: everything is visible immediately, no ring, no movement.
5. Block the script (devtools → disable JavaScript, reload): the page is fully visible and readable (the `js` class is never added, so the guard never hides anything).
6. Simulate a failing bundle: in devtools set a request block on `main*.js`, reload: content becomes visible after ~2.5 s (fallback `show`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: hero entrance, scroll reveals and custom cursor ring" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: README, final verification and delivery

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Portafolio — Johan Mihail Conde Sallo

Static bilingual (ES/EN) portfolio built with Astro 6, Tailwind 4 and GSAP.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Type-check + production build in `dist/` |
| `npm test` | Unit tests (geometry, blob, contrast, i18n) |
| `npm run media` | Rebuilds `public/media/*` and `public/og.jpg` from `assets/hero` (needs ffmpeg) |

## Assets

- `assets/hero/transition.mp4` is the source video; after replacing it run `npm run media`.
- Card images: put `a.png` (Mikha), `b.png` (GraphRAG), `c.png` (Semantic Search) in `src/assets/cards/`.
- Copy lives in `src/i18n/{es,en}.ts`. Contact data and project links in `src/data/site.ts`.
- Reveal calibration (window position/size, slats) in `src/lib/reveal/config.ts`.

## Deploy

Build with `SITE_URL=https://your-domain npm run build` so canonical, hreflang and the sitemap are emitted, then publish `dist/` to any static host (Vercel, Netlify, GitHub Pages).
````

- [ ] **Step 2: Run the full automated checks**

Run: `npm run build && npx vitest run`
Expected: build 0 errors/0 warnings that matter; all tests PASS.
Run: `ls dist/es dist/en dist/media dist/cv && du -sh dist`
Expected: pages, media (loop, 720 loop, poster) and both CVs present.
Run: `SITE_URL=https://example.dev npm run build && grep -c 'hreflang' dist/es/index.html && ls dist/sitemap-index.xml`
Expected: 2 or more hreflang matches and the sitemap exists. Then run `npm run build` again without `SITE_URL` to restore the default output.

- [ ] **Step 3: Manual verification checklist (browser, `npm run preview`)**

For each of `/es/` and `/en/` at 375, 768 and 1440 px:
- [ ] No horizontal scroll; hero readable; buttons ≥ 44 px tall.
- [ ] Hover/touch reveal works as in Task 7 Step 5; the window never exposes hair or background.
- [ ] All nav anchors and card anchors land on the right section.
- [ ] Language toggle switches pages; root `/` redirects by browser language.
- [ ] "Download CV" / "Descargar CV" downloads the matching-language PDF; no phone number visible anywhere on the pages.
- [ ] Reduced motion and JS-disabled runs are fully readable.
- [ ] Keyboard: Tab reaches every link and the mobile menu with a visible amber focus ring.
- [ ] Optional: `npx lighthouse http://localhost:4321/es/ --only-categories=performance,accessibility,seo --chrome-flags="--headless"` — LCP under 2.5 s on the poster; accessibility and SEO scores reported to the user (no rigid numeric target).

- [ ] **Step 4: Report gaps to the user and commit**

Report explicitly: card images pending (fallback tiles), repository links for Mikha and Semantic Search pending (they point to the GitHub profile), final serif font choice (compare Instrument Serif with the reference), deploy target. Then:
```bash
git add -A
git commit -m "docs: README and final verification" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review (spec coverage)

| Spec section | Task |
|---|---|
| §3–4 scope, stack | 1 |
| §5 design system | 1, 5 (contrast guard) |
| §6 IA / sections | 6, 8 |
| §7 hero, video, reveal, mobile, reduced motion | 4, 6, 7 |
| §8 content and copy (es/en) | 2, 8 |
| §9 structure, root redirect | 3 |
| §10 motion | 7, 9 |
| §11 performance, a11y, SEO | 3, 4, 8, 10 |
| §12 verification | 5, 7, 9, 10 |
| §13 delivery | 10 |
| §14 pending items | 6 (cards fallback), 10 |

Type/name consistency checked: `Dict`/`Lang`/`ProjectId` (Task 2) are the only shared types; `coverBox`, `mapRect`, `clampToRect`, `lerp`, `blobPath` and the `config.ts` constants are defined in Task 5 and used with those exact names in Task 7; DOM hooks `data-hero-media`, `data-hero-video`, `data-reveal-*`, `data-rim`, `data-slats`, `data-hit`, `data-in`, `data-reveal`, `data-cursor` are defined where produced and consumed with the same spelling. Nav "active underline" from spec §6 is implemented as hover/focus underline (the nav sits inside the hero and is not sticky, so a scroll-spy state would never be visible).
