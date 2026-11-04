import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mangadexAdapter,
  MangaDexError,
  MangaDexErrorType,
} from './mangadex.adapter';
import { Chapter, Manga } from '@/models';

// Mock de fetch global
const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockResponse(
  ok: boolean,
  status: number,
  data: any,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json', ...headers },
  }) as Response;
}

function mockSuccessResponse(data: any): Response {
  return mockResponse(true, 200, data);
}

function mockForbiddenResponse(): Response {
  return mockResponse(false, 403, { result: 'error' });
}

function mockRateLimitedResponse(): Response {
  return mockResponse(false, 429, { result: 'error' }, { 'Retry-After': '1' });
}

function mockNotFoundResponse(): Response {
  return mockResponse(false, 404, { result: 'error' });
}

function mockServerErrorResponse(): Response {
  return mockResponse(false, 500, { result: 'error' });
}

describe('mangadexAdapter - checkAvailability', () => {
  it('devuelve true cuando /ping responde OK', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ result: 'ok' }));

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(true);
  });

  it('devuelve false cuando /ping falla con error de red', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(false);
  });

  it('devuelve false cuando /ping retorna 403', async () => {
    mockFetch.mockResolvedValueOnce(mockForbiddenResponse());

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(false);
  });

  it('devuelve false cuando /ping retorna 500', async () => {
    mockFetch.mockResolvedValueOnce(mockServerErrorResponse());

    const available = await mangadexAdapter.checkAvailability!();
    expect(available).toBe(false);
  });
});

describe('mangadexAdapter - getCatalog', () => {
  it('normaliza mangas correctamente desde la API', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
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
            relationships: [
              { type: 'cover_art', attributes: { fileName: 'cover.jpg' } },
              { type: 'author', attributes: { name: 'Test Author' } },
            ],
          },
        ],
      })
    );

    const mangas = await mangadexAdapter.getCatalog!(1, 20);
    expect(mangas.length).toBe(1);
    expect(mangas[0].id).toBe('mangadex-manga-1');
    expect(mangas[0].title).toBe('Test Manga');
    expect(mangas[0].author).toBe('Test Author');
    expect(mangas[0].genres).toContain('Action');
    expect(mangas[0].cover).toContain('cover.jpg');
    expect(mangas[0].language).toBe('es');
    expect(mangas[0].sourceId).toBe('manga-1');
  });

  it('devuelve array vacío cuando no hay mangas', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ result: 'ok', data: [] }));

    const mangas = await mangadexAdapter.getCatalog!(1, 20);
    expect(mangas).toEqual([]);
  });

  it('lanza MangaDexError FORBIDDEN cuando MangaDex retorna 403', async () => {
    mockFetch.mockResolvedValueOnce(mockForbiddenResponse());

    const error = await mangadexAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(MangaDexError);
    expect(error).toMatchObject({
      type: MangaDexErrorType.FORBIDDEN,
      status: 403,
      retryable: false,
    });
  });

  it('lanza MangaDexError RATE_LIMITED cuando MangaDex retorna 429 persistente', async () => {
    mockFetch.mockResolvedValue(mockRateLimitedResponse());

    const error = await mangadexAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(MangaDexError);
    expect(error).toMatchObject({
      type: MangaDexErrorType.RATE_LIMITED,
      status: 429,
    });
  });

  it('lanza MangaDexError NETWORK_ERROR cuando hay error de red persistente', async () => {
    mockFetch.mockRejectedValue(new TypeError('failed to fetch'));

    const error = await mangadexAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(MangaDexError);
    expect(error).toMatchObject({
      type: MangaDexErrorType.NETWORK_ERROR,
    });
  });

  it('lanza MangaDexError TIMEOUT_ERROR cuando hay timeout persistente', async () => {
    mockFetch.mockRejectedValue(
      new DOMException('The operation timed out.', 'TimeoutError')
    );

    const error = await mangadexAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(MangaDexError);
    expect(error).toMatchObject({
      type: MangaDexErrorType.TIMEOUT_ERROR,
    });
  });

  it('reintenta automáticamente en errores 5xx', async () => {
    // Primera llamada falla con 500, segunda tiene éxito
    mockFetch
      .mockResolvedValueOnce(mockServerErrorResponse())
      .mockResolvedValueOnce(
        mockSuccessResponse({ result: 'ok', data: [] })
      );

    const mangas = await mangadexAdapter.getCatalog!(1, 20);
    expect(mangas).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('llama al proxy de MangaDex con la URL correcta', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ result: 'ok', data: [] }));

    await mangadexAdapter.getCatalog!(1, 20);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/manga-dex/proxy/manga'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });
});

describe('mangadexAdapter - searchManga', () => {
  it('busca y normaliza mangas por título', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: 'ok',
        data: [
          {
            id: 'search-1',
            type: 'manga',
            attributes: {
              title: { en: 'One Piece' },
              slug: 'one-piece',
              status: 'ongoing',
              updatedAt: '2024-01-01T00:00:00Z',
              tags: [{ group: 'genre', name: { en: 'Action' } }],
              description: { en: 'Pirate adventure' },
            },
            relationships: [{ type: 'cover_art', attributes: { fileName: 'cover.jpg' } }],
          },
        ],
      })
    );

    const mangas = await mangadexAdapter.searchManga!('one piece');
    expect(mangas.length).toBe(1);
    expect(mangas[0].title).toBe('One Piece');

    // Verificar que se llamó con el parámetro de título codificado
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('title=');
    expect(callUrl).toContain('one%20piece');
  });

  it('devuelve array vacío cuando no hay resultados de búsqueda', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ result: 'ok', data: [] }));

    const mangas = await mangadexAdapter.searchManga!('inexistente');
    expect(mangas).toEqual([]);
  });

  it('propaga errores de red en búsqueda', async () => {
    mockFetch.mockRejectedValue(new TypeError('failed to fetch'));

    const error = await mangadexAdapter.searchManga!('test').catch((e) => e);
    expect(error).toBeInstanceOf(MangaDexError);
  });
});

describe('mangadexAdapter - getMangaDetails', () => {
  it('obtiene detalles de un manga existente', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        data: {
          id: 'detail-1',
          type: 'manga',
          attributes: {
            title: { en: 'Detail Manga' },
            slug: 'detail-manga',
            status: 'completed',
            updatedAt: '2024-01-01T00:00:00Z',
            tags: [],
            description: { en: 'A detailed manga' },
          },
          relationships: [{ type: 'cover_art', attributes: { fileName: 'cover.jpg' } }],
        },
      })
    );

    const manga = await mangadexAdapter.getMangaDetails!('detail-1');
    expect(manga).not.toBeNull();
    expect(manga!.title).toBe('Detail Manga');
    expect(manga!.sourceId).toBe('detail-1');
  });

  it('devuelve null cuando el manga no existe (404)', async () => {
    mockFetch.mockResolvedValueOnce(mockNotFoundResponse());

    const manga = await mangadexAdapter.getMangaDetails!('nonexistent');
    expect(manga).toBeNull();
  });

  it('devuelve null cuando hay error de red', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const manga = await mangadexAdapter.getMangaDetails!('any-id');
    expect(manga).toBeNull();
  });
});

describe('mangadexAdapter - getChapters', () => {
  it('obtiene capítulos filtrados por idioma español', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
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
          {
            id: 'chapter-2',
            type: 'chapter',
            attributes: {
              chapter: '2',
              title: 'Capítulo 2',
              translatedLanguage: 'en',
              publishAt: '2024-01-02T00:00:00Z',
            },
            relationships: [],
          },
        ],
      })
    );

    const chapters = await mangadexAdapter.getChapters!('manga-1', 'es');
    // Debe filtrar solo capítulos en español
    expect(chapters.length).toBe(1);
    expect(chapters[0].language).toBe('es');
    expect(chapters[0].number).toBe('1');
  });

  it('devuelve array vacío cuando no hay capítulos', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ result: 'ok', data: [] }));

    const chapters = await mangadexAdapter.getChapters!('manga-1', 'es');
    expect(chapters).toEqual([]);
  });

  it('incluye capítulos es-la cuando se solicita español', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: 'ok',
        data: [
          {
            id: 'chapter-1',
            type: 'chapter',
            attributes: {
              chapter: '1',
              title: 'Capítulo 1',
              translatedLanguage: 'es-la',
              publishAt: '2024-01-01T00:00:00Z',
            },
            relationships: [],
          },
        ],
      })
    );

    const chapters = await mangadexAdapter.getChapters!('manga-1', 'es');
    expect(chapters.length).toBe(1);
    expect(chapters[0].language).toBe('es-la');
  });

  it('propaga errores de la API en getChapters', async () => {
    mockFetch.mockResolvedValueOnce(mockForbiddenResponse());

    await expect(mangadexAdapter.getChapters!('manga-1', 'es')).rejects.toThrow(
      MangaDexError
    );
  });
});

describe('mangadexAdapter - getChapterPages', () => {
  it('construye URLs de páginas correctamente', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        baseUrl: 'https://uploads.mangadex.org/data',
        chapter: {
          hash: 'abc123def456',
          data: ['page1.jpg', 'page2.jpg', 'page3.jpg'],
          dataSaver: [],
        },
      })
    );

    const pages = await mangadexAdapter.getChapterPages!('chapter-1');
    expect(pages.length).toBe(3);
    expect(pages[0].order).toBe(1);
    expect(pages[1].order).toBe(2);
    expect(pages[2].order).toBe(3);
    expect(pages[0].imageUrl).toContain('/api/manga-dex/image');
    expect(pages[0].imageUrl).toContain('page1.jpg');
    expect(pages[1].imageUrl).toContain('page2.jpg');
  });

  it('devuelve array vacío cuando no hay páginas', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        baseUrl: 'https://uploads.mangadex.org/data',
        chapter: { hash: 'abc', data: [], dataSaver: [] },
      })
    );

    const pages = await mangadexAdapter.getChapterPages!('chapter-1');
    expect(pages).toEqual([]);
  });

  it('devuelve array vacío cuando el at-home server falla', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const pages = await mangadexAdapter.getChapterPages!('chapter-1');
    expect(pages).toEqual([]);
  });

  it('incluye calidad data en las URLs de imagen', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        baseUrl: 'https://uploads.mangadex.org/data',
        chapter: { hash: 'hash123', data: ['p1.jpg'], dataSaver: [] },
      })
    );

    const pages = await mangadexAdapter.getChapterPages!('chapter-1');
    expect(pages[0].imageUrl).toContain('quality=data');
  });
});

describe('MangaDexError', () => {
  it('crea error FORBIDDEN con propiedades correctas', () => {
    const err = new MangaDexError(
      MangaDexErrorType.FORBIDDEN,
      'Acceso denegado',
      403,
      false
    );
    expect(err.type).toBe(MangaDexErrorType.FORBIDDEN);
    expect(err.status).toBe(403);
    expect(err.retryable).toBe(false);
    expect(err.message).toBe('Acceso denegado');
  });

  it('todos los tipos de error están definidos', () => {
    expect(MangaDexErrorType.FORBIDDEN).toBe('MANGADEX_FORBIDDEN');
    expect(MangaDexErrorType.RATE_LIMITED).toBe('MANGADEX_RATE_LIMITED');
    expect(MangaDexErrorType.NOT_FOUND).toBe('MANGADEX_NOT_FOUND');
    expect(MangaDexErrorType.SERVER_ERROR).toBe('MANGADEX_SERVER_ERROR');
    expect(MangaDexErrorType.NETWORK_ERROR).toBe('MANGADEX_NETWORK_ERROR');
    expect(MangaDexErrorType.TIMEOUT_ERROR).toBe('MANGADEX_TIMEOUT_ERROR');
    expect(MangaDexErrorType.UNKNOWN_ERROR).toBe('MANGADEX_UNKNOWN_ERROR');
  });
});
