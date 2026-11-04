import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mangadexAdapter } from './mangadex.adapter';
import { Chapter } from '@/models';

// Mock de fetch global
const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', mockFetch);
});

describe('mangadexAdapter', () => {
  it('checkAvailability devuelve true cuando el ping responde OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'ok' }),
    } as Response);

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(true);
  });

  it('checkAvailability devuelve false cuando el ping falla', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(false);
  });

  it('getCatalog normaliza mangas correctamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: 'ok',
        data: [
          {
            id: 'manga-1',
            type: 'manga',
            attributes: {
              title: { en: 'Test Manga' },
              slug: 'test-manga',
              status: 'ongoing',
              updatedAt: '2024-01-01T00:00:00Z',
              tags: [
                { group: 'genre', name: { en: 'Action' } },
                { group: 'theme', name: { en: 'Adventure' } },
              ],
              description: { en: 'A test description' },
            },
            relationships: [],
          },
        ],
      }),
    } as Response);

    const mangas = await mangadexAdapter.getCatalog!(1, 20);
    expect(mangas.length).toBe(1);
    expect(mangas[0].id).toBe('mangadex-manga-1');
    expect(mangas[0].title).toBe('Test Manga');
    expect(mangas[0].genres).toContain('Action');
  });

  it('getChapters filtra por idioma español', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: 'ok',
        data: [
          {
            id: 'chapter-1',
            type: 'chapter',
            attributes: {
              chapter: '1',
              title: 'Capítulo 1',
              translatedLanguage: 'es',
              publishAt: '2024-01-01T00:00:00Z',
            },
            relationships: [],
          },
        ],
      }),
    } as Response);

    const chapters = await mangadexAdapter.getChapters!('manga-1', 'es');
    expect(chapters.length).toBe(1);
    expect(chapters[0].language).toBe('es');
    expect(chapters[0].number).toBe('1');
  });

  it('getChapters devuelve array vacío cuando no hay capítulos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'ok', data: [] }),
    } as Response);

    const chapters = await mangadexAdapter.getChapters!('manga-1', 'es');
    expect(chapters).toEqual([]);
  });

  it('getChapterPages construye URLs de páginas correctamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        baseUrl: 'https://uploads.mangadex.org/data',
        chapter: {
          hash: 'abc123',
          data: ['page1.jpg', 'page2.jpg'],
          dataSaver: [],
        },
      }),
    } as Response);

    const pages = await mangadexAdapter.getChapterPages!('chapter-1');
    expect(pages.length).toBe(2);
    expect(pages[0].order).toBe(1);
    expect(pages[0].imageUrl).toContain('/api/manga-dex/image');
    expect(pages[1].order).toBe(2);
  });

  it('getMangaDetails devuelve null cuando el manga no existe', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Not found'));

    const manga = await mangadexAdapter.getMangaDetails!('nonexistent');
    expect(manga).toBeNull();
  });
});
