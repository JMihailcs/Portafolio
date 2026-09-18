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
