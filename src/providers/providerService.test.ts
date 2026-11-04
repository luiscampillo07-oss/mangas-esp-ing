import { describe, it, expect, vi, beforeEach } from 'vitest';
import { providerService } from './providerService';
import { providerRegistry } from './registry';
import { MangaProvider } from './interfaces/provider.interface';
import { Manga, Chapter } from '@/models';

const mockChapter: Chapter = {
  id: 'provider-c1',
  mangaId: 'm1',
  number: '1',
  title: 'Capítulo 1',
  publishedAt: '2024-01-01T00:00:00Z',
  language: 'es',
  pages: [],
};

const mockManga: Manga = {
  id: 'provider-m1',
  slug: 'test-manga',
  title: 'Test Manga',
  description: 'Desc',
  cover: 'https://example.com/cover.jpg',
  author: 'Author',
  genres: ['Action'],
  status: 'ongoing',
  language: 'es',
  sourceId: 'm1',
  sourceUrl: 'https://example.com/title/m1',
  chapters: [mockChapter],
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Crea un mock de proveedor con comportamiento configurable.
 */
function createMockProvider(overrides: Partial<MangaProvider> = {}): MangaProvider {
  const base: MangaProvider = {
    id: 'mock-provider',
    name: 'Mock Provider',
    active: true,
    status: 'APPROVED',
    providerType: ['Metadata Provider', 'Chapter Provider', 'Page Provider'],
    allowedLanguages: ['es', 'en'],
    baseUrl: 'https://mock.example.com',
    documentationUrl: 'https://mock.example.com/docs',
    checkAvailability: vi.fn().mockResolvedValue(true),
    getChapters: vi.fn().mockResolvedValue([mockChapter]),
    getChapterPages: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  return base;
}

beforeEach(() => {
  vi.restoreAllMocks();

  // Limpiar registro y crear uno limpio para cada test
  (providerRegistry as any).providers.clear();
});

describe('providerService - getCatalog', () => {
  it('obtiene catálogo de un proveedor activo exitosamente', async () => {
    const provider = createMockProvider({
      getCatalog: vi.fn().mockResolvedValue([mockManga]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Test Manga');
  });

  it('devuelve array vacío cuando no hay proveedores registrados', async () => {
    const result = await providerService.getCatalog(1, 20);
    expect(result).toEqual([]);
  });

  it('tolerancia a fallos: si un proveedor falla, los demás continúan', async () => {
    const failingProvider = createMockProvider({
      id: 'failing-provider',
      name: 'Failing Provider',
      getCatalog: vi.fn().mockRejectedValue(new Error('Provider down')),
    });
    const workingProvider = createMockProvider({
      id: 'working-provider',
      name: 'Working Provider',
      getCatalog: vi.fn().mockResolvedValue([mockManga]),
    });

    providerRegistry.register(failingProvider);
    providerRegistry.register(workingProvider);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Test Manga');
  });

  it('lanzar error cuando TODOS los proveedores fallan', async () => {
    const failingProvider1 = createMockProvider({
      id: 'fail-1',
      name: 'Fail Provider 1',
      getCatalog: vi.fn().mockRejectedValue(new Error('Error 1')),
    });
    const failingProvider2 = createMockProvider({
      id: 'fail-2',
      name: 'Fail Provider 2',
      getCatalog: vi.fn().mockRejectedValue(new Error('Error 2')),
    });

    providerRegistry.register(failingProvider1);
    providerRegistry.register(failingProvider2);

    await expect(providerService.getCatalog(1, 20)).rejects.toThrow(
      /Todos los proveedores fallaron/
    );
  });

  it('no lanza error si algunos proveedores devuelven resultados aunque otros fallen', async () => {
    const failingProvider = createMockProvider({
      id: 'partial-fail',
      name: 'Partial Fail',
      getCatalog: vi.fn().mockRejectedValue(new Error('Down')),
    });
    const workingProvider = createMockProvider({
      id: 'partial-work',
      name: 'Partial Work',
      getCatalog: vi.fn().mockResolvedValue([mockManga]),
    });

    providerRegistry.register(failingProvider);
    providerRegistry.register(workingProvider);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(1);
  });

  it('ignora proveedores que no implementan getCatalog', async () => {
    const providerWithoutCatalog = createMockProvider({
      id: 'no-catalog',
      name: 'No Catalog',
    });
    // No asignar getCatalog
    delete (providerWithoutCatalog as any).getCatalog;
    providerRegistry.register(providerWithoutCatalog);

    const result = await providerService.getCatalog(1, 20);
    expect(result).toEqual([]);
  });

  it('elimina duplicados por sourceId', async () => {
    const provider = createMockProvider({
      getCatalog: vi.fn().mockResolvedValue([
        { ...mockManga, sourceId: 'same-id' },
        { ...mockManga, sourceId: 'same-id', title: 'Mismo manga otro proveedor' },
      ]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(1);
  });
});

describe('providerService - searchManga', () => {
  it('busca mangas en proveedores activos', async () => {
    const provider = createMockProvider({
      searchManga: vi.fn().mockResolvedValue([mockManga]),
    });
    providerRegistry.register(provider);

    const result = await providerService.searchManga('test');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Test Manga');
  });

  it('devuelve array vacío para consulta vacía', async () => {
    const result = await providerService.searchManga('');
    expect(result).toEqual([]);

    const result2 = await providerService.searchManga('   ');
    expect(result2).toEqual([]);
  });

  it('lanzar error cuando todos los proveedores fallan en búsqueda', async () => {
    const failingProvider = createMockProvider({
      id: 'search-fail',
      name: 'Search Fail',
      searchManga: vi.fn().mockRejectedValue(new Error('Search error')),
    });
    providerRegistry.register(failingProvider);

    await expect(providerService.searchManga('test')).rejects.toThrow(
      /Todos los proveedores fallaron/
    );
  });

  it('tolerancia a fallos en búsqueda: algunos fallan, otros funcionan', async () => {
    const failingProvider = createMockProvider({
      id: 'search-partial-fail',
      name: 'Search Partial Fail',
      searchManga: vi.fn().mockRejectedValue(new Error('Down')),
    });
    const workingProvider = createMockProvider({
      id: 'search-partial-work',
      name: 'Search Partial Work',
      searchManga: vi.fn().mockResolvedValue([mockManga]),
    });

    providerRegistry.register(failingProvider);
    providerRegistry.register(workingProvider);

    const result = await providerService.searchManga('test');
    expect(result.length).toBe(1);
  });
});

describe('providerService - getMangaDetails', () => {
  it('obtiene detalles de un manga existente', async () => {
    const provider = createMockProvider({
      getMangaDetails: vi.fn().mockResolvedValue(mockManga),
    });
    providerRegistry.register(provider);

    const result = await providerService.getMangaDetails('m1');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Manga');
  });

  it('devuelve null cuando ningún proveedor tiene el manga', async () => {
    const provider = createMockProvider({
      getMangaDetails: vi.fn().mockResolvedValue(null),
    });
    providerRegistry.register(provider);

    const result = await providerService.getMangaDetails('nonexistent');
    expect(result).toBeNull();
  });

  it('devuelve null cuando todos los proveedores fallan en detalles', async () => {
    const failingProvider = createMockProvider({
      id: 'details-fail',
      name: 'Details Fail',
      getMangaDetails: vi.fn().mockRejectedValue(new Error('Error')),
    });
    providerRegistry.register(failingProvider);

    const result = await providerService.getMangaDetails('any-id');
    expect(result).toBeNull();
  });

  it('ignora proveedores que no implementan getMangaDetails', async () => {
    const provider = createMockProvider({
      id: 'no-details',
      name: 'No Details',
    });
    delete (provider as any).getMangaDetails;
    providerRegistry.register(provider);

    const result = await providerService.getMangaDetails('any-id');
    expect(result).toBeNull();
  });
});

describe('providerService - getChapters', () => {
  it('obtiene capítulos filtrados por idioma', async () => {
    const provider = createMockProvider({
      getChapters: vi.fn().mockResolvedValue([mockChapter]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getChapters('m1', 'es');
    expect(result.length).toBe(1);
    expect(result[0].language).toBe('es');
  });

  it('devuelve array vacío cuando no hay capítulos', async () => {
    const provider = createMockProvider({
      getChapters: vi.fn().mockResolvedValue([]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getChapters('m1', 'es');
    expect(result).toEqual([]);
  });

  it('devuelve array vacío cuando todos los proveedores fallan en capítulos', async () => {
    const failingProvider = createMockProvider({
      id: 'chapters-fail',
      name: 'Chapters Fail',
      getChapters: vi.fn().mockRejectedValue(new Error('Error')),
    });
    providerRegistry.register(failingProvider);

    const result = await providerService.getChapters('m1', 'es');
    expect(result).toEqual([]);
  });

  it('ignora proveedores que no implementan getChapters', async () => {
    const provider = createMockProvider({
      id: 'no-chapters',
      name: 'No Chapters',
    });
    delete (provider as any).getChapters;
    providerRegistry.register(provider);

    const result = await providerService.getChapters('m1', 'es');
    expect(result).toEqual([]);
  });
});

describe('providerService - getChapterPages', () => {
  it('obtiene páginas de un capítulo', async () => {
    const mockPages: Chapter['pages'] = [
      { id: 'p1', imageUrl: '/img/1.jpg', order: 1 },
      { id: 'p2', imageUrl: '/img/2.jpg', order: 2 },
    ];
    const provider = createMockProvider({
      getChapterPages: vi.fn().mockResolvedValue(mockPages),
    });
    providerRegistry.register(provider);

    const result = await providerService.getChapterPages('c1');
    expect(result.length).toBe(2);
    expect(result[0].order).toBe(1);
  });

  it('devuelve array vacío cuando no hay páginas', async () => {
    const provider = createMockProvider({
      getChapterPages: vi.fn().mockResolvedValue([]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getChapterPages('c1');
    expect(result).toEqual([]);
  });

  it('devuelve array vacío cuando todos los proveedores fallan en páginas', async () => {
    const failingProvider = createMockProvider({
      id: 'pages-fail',
      name: 'Pages Fail',
      getChapterPages: vi.fn().mockRejectedValue(new Error('Error')),
    });
    providerRegistry.register(failingProvider);

    const result = await providerService.getChapterPages('c1');
    expect(result).toEqual([]);
  });
});

describe('providerService - checkAllProvidersAvailability', () => {
  it('devuelve estado de disponibilidad de todos los proveedores', async () => {
    const provider1 = createMockProvider({
      id: 'provider-1',
      name: 'Provider 1',
      checkAvailability: vi.fn().mockResolvedValue(true),
    });
    const provider2 = createMockProvider({
      id: 'provider-2',
      name: 'Provider 2',
      checkAvailability: vi.fn().mockResolvedValue(false),
    });

    providerRegistry.register(provider1);
    providerRegistry.register(provider2);

    const result = await providerService.checkAllProvidersAvailability();
    expect(result['provider-1']).toBe(true);
    expect(result['provider-2']).toBe(false);
  });
});

describe('providerService - deduplicate', () => {
  it('no duplica mangas con el mismo sourceId', async () => {
    const provider = createMockProvider({
      getCatalog: vi.fn().mockResolvedValue([
        { ...mockManga, sourceId: 'dup-1', title: 'Manga A' },
        { ...mockManga, sourceId: 'dup-1', title: 'Manga A (otro proveedor)' },
        { ...mockManga, sourceId: 'dup-2', title: 'Manga B' },
      ]),
    });
    providerRegistry.register(provider);

    const result = await providerService.getCatalog(1, 20);
    expect(result.length).toBe(2);
    const sourceIds = result.map((m) => m.sourceId);
    expect(sourceIds).toContain('dup-1');
    expect(sourceIds).toContain('dup-2');
  });
});
