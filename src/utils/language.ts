/**
 * Códigos de idioma normalizados según el requisito del proyecto.
 */
export const LANGUAGE_CODES = {
  SPANISH: 'es',
  ENGLISH: 'en',
  JAPANESE: 'ja',
} as const;

/**
 * Comprueba si un código de idioma es español (incluye variantes regionales).
 */
export function isSpanish(language: string): boolean {
  const normalized = language.toLowerCase();
  return normalized === 'es' || normalized === 'es-la' || normalized === 'es-419' || normalized === 'es-es';
}

/**
 * Obtiene el nombre legible de un código de idioma.
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    es: 'Español',
    'es-la': 'Español (Latinoamérica)',
    en: 'Inglés',
    ja: 'Japonés',
  };
  return names[code.toLowerCase()] || code;
}
