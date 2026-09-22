# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- **Astro scoped CSS does not apply to elements created client-side.** Astro compiles a `<style>` block's selectors to require a per-component `data-astro-cid-*` attribute, which is only stamped onto elements present in the component's own template — never onto nodes a script later builds with `document.createElement`/`innerHTML`. Any CSS rule in an `.astro` file meant to style dynamically-inserted DOM (see `src/components/Assistant.astro`'s chat bubbles, appended by `src/scripts/assistant.ts`) must be wrapped in `:global(...)`, or it will silently never match (no error — the rule just never applies).
- **`max-width` on a `position: absolute` child does nothing if its positioned-ancestor container has no explicit width.** `.assistant` (the fixed container in `Assistant.astro`) is a flex column sized by its in-flow children only (the 56px fab); an absolutely-positioned child like `.assistant-teaser` is excluded from that intrinsic-size calculation, so its shrink-to-fit width is computed against a near-zero containing block and collapses toward min-content regardless of `max-width`. Use an explicit `width` (e.g. `width: min(320px, calc(100vw - 2rem))`) on such elements instead of `max-width`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
