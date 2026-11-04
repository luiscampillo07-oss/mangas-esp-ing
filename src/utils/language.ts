/**
 * Códigos de idioma normalizados según el requisito del proyecto.
 * Solo se admiten español e inglés.
 */
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Mapeo de variantes de idioma a códigos normalizados.
 */
const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  // Español
  es: 'es',
  'es-ES': 'es',
  'es-419': 'es',
  'es-la': 'es',
  spa: 'es',
  Spanish: 'es',
  Español: 'es',
  ESPAÑOL: 'es',
  // Inglés
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  eng: 'en',
  English: 'en',
  INGLÉS: 'en',
};

/**
 * Normaliza un código de idioma a su forma canónica (es o en).
 * Devuelve null si el idioma no es español ni inglés.
 */
export function normalizeLanguage(language: string | undefined | null): SupportedLanguage | null {
  if (!language) return null;

  const trimmed = language.trim();

  // Comprobación directa
  if (trimmed === 'es' || trimmed === 'en') {
    return trimmed as SupportedLanguage;
  }

  // Comprobación en el mapa de alias
  const alias = LANGUAGE_ALIASES[trimmed];
  if (alias) return alias;

  // Comprobación case-insensitive para variantes comunes
  const lower = trimmed.toLowerCase();
  const aliasLower = LANGUAGE_ALIASES[lower];
  if (aliasLower) return aliasLower;

  // Comprobación de prefijos (ej: es-ES, en-US)
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';

  return null;
}

/**
 * Comprueba si un código de idioma es español.
 */
export function isSpanish(language: string): boolean {
  return normalizeLanguage(language) === 'es';
}

/**
 * Comprueba si un código de idioma es inglés.
 */
export function isEnglish(language: string): boolean {
  return normalizeLanguage(language) === 'en';
}

/**
 * Comprueba si un idioma está entre los soportados (es o en).
 */
export function isSupportedLanguage(language: string): boolean {
  return normalizeLanguage(language) !== null;
}

/**
 * Obtiene el nombre legible de un código de idioma.
 */
export function getLanguageName(code: string): string {
  const normalized = normalizeLanguage(code);
  const names: Record<SupportedLanguage, string> = {
    es: 'Español',
    en: 'Inglés',
  };
  return normalized ? names[normalized] : code;
}
