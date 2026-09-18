import { en } from './en';
import { es } from './es';
import type { Dict, Lang } from './types';

export type { Dict, Lang, ProjectId } from './types';
export const dicts: Record<Lang, Dict> = { es, en };
export const otherLang = (l: Lang): Lang => (l === 'es' ? 'en' : 'es');
