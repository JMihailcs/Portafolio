import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ error: 'disabled' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  });
