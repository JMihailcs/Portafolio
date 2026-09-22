import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Load .env (gitignored) so the eval runs locally without exporting variables.
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m) process.env[m[1]] ??= m[2];
  }
} catch { /* no .env: rely on the shell environment */ }

export default defineConfig({
  test: { include: ['src/evals/assistant/**/*.eval.ts'], testTimeout: 240_000, hookTimeout: 60_000 },
});
