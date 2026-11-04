import { describe, it, expect } from 'vitest';
import { isSpanish, getLanguageName, LANGUAGE_CODES } from './language';

describe('isSpanish', () => {
  it('reconoce es como español', () => {
    expect(isSpanish('es')).toBe(true);
  });

  it('reconoce es-la como español', () => {
    expect(isSpanish('es-la')).toBe(true);
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

describe('LANGUAGE_CODES', () => {
  it('tiene los códigos esperados', () => {
    expect(LANGUAGE_CODES.SPANISH).toBe('es');
    expect(LANGUAGE_CODES.ENGLISH).toBe('en');
    expect(LANGUAGE_CODES.JAPANESE).toBe('ja');
  });
});
