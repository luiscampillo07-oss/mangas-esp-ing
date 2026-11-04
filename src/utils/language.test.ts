import { describe, it, expect } from 'vitest';
import {
  isSpanish,
  isEnglish,
  isSupportedLanguage,
  normalizeLanguage,
  getLanguageName,
  SUPPORTED_LANGUAGES,
} from './language';

describe('normalizeLanguage', () => {
  it('normaliza es como español', () => {
    expect(normalizeLanguage('es')).toBe('es');
  });

  it('normaliza es-ES como español', () => {
    expect(normalizeLanguage('es-ES')).toBe('es');
  });

  it('normaliza spa como español', () => {
    expect(normalizeLanguage('spa')).toBe('es');
  });

  it('normaliza Spanish como español', () => {
    expect(normalizeLanguage('Spanish')).toBe('es');
  });

  it('normaliza Español como español', () => {
    expect(normalizeLanguage('Español')).toBe('es');
  });

  it('normaliza en como inglés', () => {
    expect(normalizeLanguage('en')).toBe('en');
  });

  it('normaliza en-US como inglés', () => {
    expect(normalizeLanguage('en-US')).toBe('en');
  });

  it('normaliza eng como inglés', () => {
    expect(normalizeLanguage('eng')).toBe('en');
  });

  it('normaliza English como inglés', () => {
    expect(normalizeLanguage('English')).toBe('en');
  });

  it('devuelve null para japonés', () => {
    expect(normalizeLanguage('ja')).toBe(null);
  });

  it('devuelve null para francés', () => {
    expect(normalizeLanguage('fr')).toBe(null);
  });

  it('devuelve null para undefined', () => {
    expect(normalizeLanguage(undefined as any)).toBe(null);
  });

  it('devuelve null para string vacío', () => {
    expect(normalizeLanguage('')).toBe(null);
  });
});

describe('isSpanish', () => {
  it('reconoce es como español', () => {
    expect(isSpanish('es')).toBe(true);
  });

  it('reconoce es-ES como español', () => {
    expect(isSpanish('es-ES')).toBe(true);
  });

  it('reconoce es-la como español', () => {
    expect(isSpanish('es-la')).toBe(true);
  });

  it('reconoce Spanish como español', () => {
    expect(isSpanish('Spanish')).toBe(true);
  });

  it('no reconoce en como español', () => {
    expect(isSpanish('en')).toBe(false);
  });

  it('no reconoce ja como español', () => {
    expect(isSpanish('ja')).toBe(false);
  });

  it('es case-insensitive', () => {
    expect(isSpanish('ES')).toBe(true);
    expect(isSpanish('Es-La')).toBe(true);
  });
});

describe('isEnglish', () => {
  it('reconoce en como inglés', () => {
    expect(isEnglish('en')).toBe(true);
  });

  it('reconoce en-US como inglés', () => {
    expect(isEnglish('en-US')).toBe(true);
  });

  it('reconoce en-GB como inglés', () => {
    expect(isEnglish('en-GB')).toBe(true);
  });

  it('reconoce English como inglés', () => {
    expect(isEnglish('English')).toBe(true);
  });

  it('no reconoce es como inglés', () => {
    expect(isEnglish('es')).toBe(false);
  });

  it('no reconoce ja como inglés', () => {
    expect(isEnglish('ja')).toBe(false);
  });
});

describe('isSupportedLanguage', () => {
  it('reconoce es como soportado', () => {
    expect(isSupportedLanguage('es')).toBe(true);
  });

  it('reconoce en como soportado', () => {
    expect(isSupportedLanguage('en')).toBe(true);
  });

  it('no reconoce ja como soportado', () => {
    expect(isSupportedLanguage('ja')).toBe(false);
  });

  it('no reconoce fr como soportado', () => {
    expect(isSupportedLanguage('fr')).toBe(false);
  });
});

describe('getLanguageName', () => {
  it('devuelve nombre para es', () => {
    expect(getLanguageName('es')).toBe('Español');
  });

  it('devuelve nombre para en', () => {
    expect(getLanguageName('en')).toBe('Inglés');
  });

  it('devuelve el código si no existe nombre', () => {
    expect(getLanguageName('fr')).toBe('fr');
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('contiene es y en', () => {
    expect(SUPPORTED_LANGUAGES).toContain('es');
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES.length).toBe(2);
  });
});
