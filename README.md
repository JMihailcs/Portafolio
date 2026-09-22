# Portafolio — Johan Mihail Conde Sallo

Bilingual (ES/EN) portfolio built with Astro 6, Tailwind 4 and GSAP, with a chat assistant
(`/api/chat`) that answers questions about Johan using a curated profile as its only knowledge
source. Deployed on Vercel via `@astrojs/vercel` (mostly-static site plus one dynamic route).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321 (serves `/api/chat` dynamically; static pages included) |
| `npm run build` | `astro check` + adapter build. Output is `.vercel/output/` (see Deploy below), not a plain static `dist/` |
| `npm test` | Unit + route tests (`tests/**/*.test.ts`), no network |
| `npm run test:e2e` | Playwright (Chromium) against the dev server. First run: `npx playwright install chromium` |
| `npm run eval:assistant` | Real-model eval, ~25 graded ES/EN questions, costs cents, manual, needs `ANTHROPIC_API_KEY` in `.env` |
| `npm run media` | Rebuilds `public/media/*` and `public/og.jpg` from `assets/hero` (needs ffmpeg) |

Note: `npm run preview` is not usable with the pinned `@astrojs/vercel@10.0.8` adapter (it refuses
to run) — all manual and e2e checks in this repo go through `npm run dev`, never `preview`.

## Assets

- `assets/hero/transition.mp4` is the source video; after replacing it run `npm run media`.
- Card images: put `a.png` (Mikha), `b.png` (GraphRAG), `c.png` (Semantic Search) in `src/assets/cards/`.
- Copy lives in `src/i18n/{es,en}.ts`. Contact data and project links in `src/data/site.ts`.
- Reveal calibration (window position/size, slats) in `src/lib/reveal/config.ts`.

## Assistant

A floating widget (bottom-right on every page) opens a chat backed by the single server route
`src/pages/api/chat.ts`. Everything the model is allowed to say about Johan comes from one file:

- `src/assistant/profile.md` — the curated knowledge source. **Review this file before publishing
  or updating it**; nothing else feeds the model facts about Johan.
- `src/assistant/system-prompt.ts` — wraps the profile with the assistant's rules (scope, tone,
  refusal behavior, ES/EN).
- `src/pages/api/chat.ts` — the only dynamic route in the app (`export const prerender = false`);
  everything else is prerendered static HTML.

### Env vars

Set in Vercel for the real deployment; `.env.example` documents the names, and real values are
never committed (`.env` is gitignored).

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Calls the model (Claude Haiku). Missing/empty ⇒ `503 unavailable`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis-backed rate limiting. Missing ⇒ the limiter fails closed (`503 unavailable`), never open. |
| `ASSISTANT_ENABLED` | Must be exactly `true` to serve the assistant; anything else (including absent) ⇒ `503 disabled` and the widget shows its off-state copy with an email fallback. |
| `DAILY_MESSAGE_CAP` | Optional global daily message cap (default 200). |

### Guardrails (spec §6)

- Per IP: 8 messages / 10 minutes, plus 30 messages / day.
- Global: 200 messages / day (configurable via `DAILY_MESSAGE_CAP`).
- Same-origin only (non-matching `Origin` on POST ⇒ `403 forbidden`); this also means POSTing
  JSON with no `Origin` header at all is rejected the same way as a foreign origin.
- Every guard fails closed: a broken rate-limit store, a missing API key, or the switch being off
  all return an error rather than silently letting a request through.
- Logging is metadata-only (status, latency, token usage) — never message content or IP.

### Eval suite — not yet run against a live model

`npm run eval:assistant` (~25 graded ES/EN questions covering facts, derived reasoning and
prompt-injection resistance) exists and is checked in, but **it has never been run in this
environment**: there is no `ANTHROPIC_API_KEY` / Upstash credentials available in this worktree.
Before (or shortly after) production rollout, run it against a real key and confirm it clears the
target thresholds — ≥90% facts, 100% derivation, 100% injection-resistance (spec §14) — and record
the usage/cost numbers it reports.

## Deploy

The Vercel adapter (`@astrojs/vercel@10.0.8`, pinned — newer major versions require Astro 7, which
this repo does not use) builds into `.vercel/output/`: a `static/` directory of prerendered pages
(`/`, `/es/`, `/en/`, assets) plus a single catch-all serverless function
(`functions/_render.func`) that serves every dynamic route, including `/api/chat`. `dist/` still
exists after a build but only holds `dist/client` (client-side assets) — it is not a deployable
site by itself. Build with `SITE_URL=https://your-domain npm run build` so canonical, hreflang and
the sitemap are emitted (verify with e.g. `grep -c hreflang .vercel/output/static/es/index.html`),
then rebuild once more without `SITE_URL` before deploying.

Deploy flow:
1. Provision Upstash Redis (free plan) from the Vercel Marketplace — this injects its env vars.
2. Create an Anthropic API key scoped to this project with a spend cap set in the console.
3. In Vercel, set `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
   `ASSISTANT_ENABLED=true`, and optionally `DAILY_MESSAGE_CAP`.
4. Push the branch and open a preview deployment (connect the repo to Vercel if not already done).
5. On the preview, confirm streaming works end-to-end:
   `curl -N -X POST https://<preview>/api/chat -H 'content-type: application/json' -H 'origin: https://<preview>' -d '{"lang":"es","messages":[{"role":"user","content":"¿Quién es Johan?"}]}'`
   should return incremental `data:` lines, not one buffered blob; repeat without `origin` ⇒ 403;
   temporarily set `ASSISTANT_ENABLED` to anything but `true` ⇒ 503 `disabled`.
6. Run `npm run eval:assistant` locally against the real key and review the results table (see
   "Eval suite" above — not yet done in this environment); cross-check token usage in the preview
   logs.
7. Promote the preview to production.
