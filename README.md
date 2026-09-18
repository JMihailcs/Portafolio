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
