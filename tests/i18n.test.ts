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
      expect(s).not.toMatch(/lorem ipsum|\bTODO\b|\bTBD\b/);
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
