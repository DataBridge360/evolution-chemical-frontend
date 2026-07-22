export const YACIMIENTOS = [
  { slug: 'sch', apiValue: 'SCH', label: 'SCH', description: 'Sierra Chata' },
  { slug: 'ema', apiValue: 'EMA', label: 'EMA', description: 'El Mangrullo' },
] as const;

export type YacimientoSlug = (typeof YACIMIENTOS)[number]['slug'];

export function getYacimientoBySlug(slug: string) {
  return YACIMIENTOS.find((y) => y.slug === slug);
}

export function yacimientoSlugToApi(slug: string): string {
  return getYacimientoBySlug(slug)?.apiValue ?? slug.toUpperCase();
}
