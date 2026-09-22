import { describe, expect, it } from 'vitest';
import profile from '../../src/assistant/profile.md?raw';
import { buildSystemPrompt } from '../../src/assistant/system-prompt';

describe('system prompt', () => {
  const es = buildSystemPrompt('es');
  const en = buildSystemPrompt('en');

  it('embeds the full profile', () => {
    expect(es).toContain('# Perfil de Johan Mihail Conde Sallo');
    expect(es).toContain('qwen3:8b');            // fact used by the evals (spec §11)
    expect(es).toContain('jm.condesallo@gmail.com');
    expect(en).toContain('# Perfil de Johan Mihail Conde Sallo'); // profile is shared
  });
  it('contains the behaviour rules', () => {
    expect(es).toContain('Reglas del asistente');
    expect(es).toContain('texto plano');   // plain text, no markdown (review decision)
    expect(es).toContain('sin markdown');
    expect(en).toContain('Assistant rules');
    expect(en).toContain('plain text');
  });
  it('localises the rules per language', () => {
    expect(es).not.toBe(en);
    expect(es.slice(0, 200)).not.toBe(en.slice(0, 200));
  });
  it('routes sensitive topics to the email', () => {
    expect(es).toContain('sueldo');
    expect(es).toContain('disponibilidad');
    expect(en).toContain('salary');
    expect(en).toContain('availability');
  });
  it('THE PROFILE CONTAINS NO PHONE NUMBER (spec §11)', () => {
    expect(profile).not.toContain('+51');
    expect(profile).not.toContain('900 748');
    expect(profile).not.toMatch(/\b\d{2}[ -]?\d{3}[ -]?\d{4}\b/); // generic 9-digit phone shape
  });
});
