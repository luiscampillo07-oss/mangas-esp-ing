import { describe, it, expect, vi, beforeEach } from 'vitest';
import { providerService } from './providerService';
import { providerRegistry } from './registry';
import { mangadexAdapter } from './adapters';
import { Manga, Chapter } from '@/models';

const mockManga: Manga = {
  id: 'mangadex-m1',
  slug: 'test-manga',
  title: 'Test Manga',
  description: 'Desc',
  cover: 'https://example.com/cover.jpg',
  author: 'Author',
  genres: ['Action'],
  status: 'ongoing',
  language: 'es',
  sourceId: 'm1',
  sourceUrl: 'https://mangadex.org/title/m1',
  chapters: [],
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockChapter: Chapter = {
  id: 'mangadex-c1',
  mangaId: 'm1',
  number: '1',
  title: 'Capítulo 1',
  publishedAt: '2024-01-01T00:00:00Z',
  language: 'es',
  pages: [],
};

beforeEach(() => {
  // Limpiar registro y registrar solo el adaptador mock
  vi.restoreAllMocks();

  // Crear un registro limpio
  (providerRegistry as any).providers.clear();
  providerRegistry.register(mangadexAdapter);
});

describe('providerService', () => {
  it('getCatalog tolera fallos de proveedores individuales', async () => {
    // Hacer que getCatalog falle
    const originalGetCatalog = mangadexAdapter.getCatalog;
    mangadexAdapter.getCatalog = vi.fn().mockRejectedValue(new Error('Provider down'));

    const result = await providerService.getCatalog(1, 20);
    expect(result).toEqual([]);

    // Restaurar
    mangadexAdapter.getCatalog = originalGetCatalog;
  });

  it('searchManga busca en proveedores activos', async () => {
    const originalSearch = mangadexAdapter.searchManga;
    mangadexAdapter.searchManga = vi.fn().mockResolvedValue([mockManga]);

    const result = await providerService.searchManga('test');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Test Manga');

    mangadexAdapter.searchManga = originalSearch;
  });

  it('getChapters filtra por idioma español', async () => {
    const originalGetChapters = mangadexAdapter.getChapters;
    mangadexAdapter.getChapters = vi.fn().mockResolvedValue([mockChapter]);

    const result = await providerService.getChapters('m1', 'es');
    expect(result.length).toBe(1);
    expect(result[0].language).toBe('es');

    mangadexAdapter.getChapters = originalGetChapters;
  });

  it('getChapterPages obtiene páginas de un capítulo', async () => {
    const originalGetPages = mangadexAdapter.getChapterPages;
    const mockPages: Chapter['pages'] = [
      { id: 'p1', imageUrl: '/img/1.jpg', order: 1 },
      { id: 'p2', imageUrl: '/img/2.jpg', order: 2 },
    ];
    mangadexAdapter.getChapterPages = vi.fn().mockResolvedValue(mockPages);

    const result = await providerService.getChapterPages('c1');
    expect(result.length).toBe(2);
    expect(result[0].order).toBe(1);

    mangadexAdapter.getChapterPages = originalGetPages;
  });

  it('no une mangas automáticamente cuando hay incertidumbre (deduplica por sourceId)', async () => {
    const originalCatalog = mangadexAdapter.getCatalog;
    mangadexAdapter.getCatalog = vi.fn().mockResolvedValue([
      { ...mockManga, sourceId: 'same-id' },
      { ...mockManga, sourceId: 'same-id', title: 'Mismo manga, otro proveedor' },
    ]);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(1);

    mangadexAdapter.getCatalog = originalCatalog;
  });
});
