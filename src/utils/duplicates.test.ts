import { describe, it, expect } from 'vitest';
import { findDuplicates, normalizeTitle } from './duplicates';
import { Manga } from '@/models';

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    id: 'm1',
    slug: 'test-manga',
    title: 'Test Manga',
    description: 'A test manga',
    cover: undefined,
    author: 'Test Author',
    genres: ['Action'],
    status: 'ongoing',
    language: 'es',
    sourceId: 'source-1',
    sourceUrl: 'https://example.com/manga/1',
    license: undefined,
    licenseUrl: undefined,
    chapters: [],
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('findDuplicates', () => {
  it('no detecta duplicados cuando todos los sourceId son únicos', () => {
    const mangas = [
      makeManga({ sourceId: 'a-1', title: 'Manga A' }),
      makeManga({ sourceId: 'b-1', title: 'Manga B' }),
    ];
    expect(findDuplicates(mangas)).toEqual([]);
  });

  it('detecta duplicados por sourceId repetido', () => {
    const mangas = [
      makeManga({ sourceId: 'dup-1', title: 'Manga Duplicado' }),
      makeManga({ sourceId: 'dup-1', title: 'Manga Duplicado 2' }),
    ];
    const result = findDuplicates(mangas);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('dup-1');
    expect(result[0].sources).toHaveLength(2);
  });

  it('devuelve array vacío para input vacío', () => {
    expect(findDuplicates([])).toEqual([]);
  });
});

describe('normalizeTitle', () => {
  it('convierte a minúsculas y elimina espacios extra', () => {
    expect(normalizeTitle('  One Piece  ')).toBe('one piece');
    expect(normalizeTitle('NARUTO   Shippuden')).toBe('naruto shippuden');
  });
});
