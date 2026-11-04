import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  comixAdapter,
  ComixError,
  ComixErrorType,
} from './comix.adapter';
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

function mockSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'application/json' },
  }) as Response;
}

function mockNotFoundResponse(): Response {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    statusText: 'Not Found',
    headers: { 'Content-Type': 'application/json' },
  }) as Response;
}

function mockServerErrorResponse(): Response {
  return new Response(JSON.stringify({ error: 'Internal error' }), {
    status: 500,
    statusText: 'Internal Server Error',
    headers: { 'Content-Type': 'application/json' },
  }) as Response;
}

describe('comixAdapter - checkAvailability', () => {
  it('devuelve true cuando /home responde OK', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ popular: [], latest: [] }));

    const available = await comixAdapter.checkAvailability!();
    expect(available).toBe(true);
  });

  it('devuelve false cuando /home falla con error de red', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const available = await comixAdapter.checkAvailability!();
    expect(available).toBe(false);
  });

  it('devuelve false cuando /home retorna 500', async () => {
    mockFetch.mockResolvedValueOnce(mockServerErrorResponse());

    const available = await comixAdapter.checkAvailability!();
    expect(available).toBe(false);
  });
});

describe('comixAdapter - getCatalog', () => {
  it('normaliza mangas desde popular y latest del home', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        popular: [
          {
            id: 'test-1',
            title: 'Test Manga 1',
            img: '/images/covers/test.jpg',
            link: '/title/test-1',
            chapter: 'Ch.1',
            genres: ['Action'],
            status: 'ongoing',
          },
        ],
        latest: [
          {
            id: 'test-2',
            title: 'Test Manga 2',
            img: '/images/covers/test2.jpg',
            link: '/title/test-2',
            chapter: 'Ch.2',
            genres: ['Adventure'],
            status: 'completed',
          },
        ],
      })
    );

    const mangas = await comixAdapter.getCatalog!(1, 20);
    expect(mangas.length).toBe(2);
    expect(mangas[0].id).toBe('comix-test-1');
    expect(mangas[0].title).toBe('Test Manga 1');
    expect(mangas[0].genres).toContain('Action');
    expect(mangas[0].language).toBe('es');
    expect(mangas[0].cover).toContain('/api/image?url=');
  });

  it('devuelve array vacío cuando no hay mangas', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({ popular: [], latest: [] })
    );

    const mangas = await comixAdapter.getCatalog!(1, 20);
    expect(mangas).toEqual([]);
  });

  it('lanza ComixError NOT_FOUND cuando la API retorna 404', async () => {
    mockFetch.mockResolvedValueOnce(mockNotFoundResponse());

    const error = await comixAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(ComixError);
    expect(error).toMatchObject({
      type: ComixErrorType.NOT_FOUND,
      status: 404,
      retryable: false,
    });
  });

  it('lanza ComixError NETWORK_ERROR cuando hay error de red persistente', async () => {
    mockFetch.mockRejectedValue(new TypeError('failed to fetch'));

    const error = await comixAdapter.getCatalog!(1, 20).catch((e) => e);
    expect(error).toBeInstanceOf(ComixError);
    expect(error).toMatchObject({
      type: ComixErrorType.NETWORK_ERROR,
    });
  });

  it('reintenta automáticamente en errores 5xx', async () => {
    mockFetch
      .mockResolvedValueOnce(mockServerErrorResponse())
      .mockResolvedValueOnce(
        mockSuccessResponse({ popular: [], latest: [] })
      );

    const mangas = await comixAdapter.getCatalog!(1, 20);
    expect(mangas).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('llama al endpoint /home con parámetros correctos', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ popular: [], latest: [] }));

    await comixAdapter.getCatalog!(1, 20);

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('/api/manga/home');
    expect(callUrl).toContain('sfw=true');
  });
});

describe('comixAdapter - searchManga', () => {
  it('busca y normaliza mangas por título', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        results: [
          {
            id: 'search-1',
            title: 'One Piece',
            img: '/images/covers/onepiece.jpg',
            link: '/title/one-piece',
            chapter: 'Ch.1100',
            genres: ['Action', 'Adventure'],
            status: 'ongoing',
          },
        ],
      })
    );

    const mangas = await comixAdapter.searchManga!('one piece');
    expect(mangas.length).toBe(1);
    expect(mangas[0].title).toBe('One Piece');

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('/search');
    expect(callUrl).toContain('q=one%20piece');
  });

  it('devuelve array vacío cuando no hay resultados de búsqueda', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ results: [] }));

    const mangas = await comixAdapter.searchManga!('inexistente');
    expect(mangas).toEqual([]);
  });

  it('propaga errores de red en búsqueda', async () => {
    mockFetch.mockRejectedValue(new TypeError('failed to fetch'));

    const error = await comixAdapter.searchManga!('test').catch((e) => e);
    expect(error).toBeInstanceOf(ComixError);
  });
});

describe('comixAdapter - getMangaDetails', () => {
  it('obtiene detalles de un manga existente', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        id: 'detail-1',
        title: 'Detail Manga',
        img: '/images/covers/detail.jpg',
        link: '/title/detail-1',
        chapter: 'Ch.5',
        genres: ['Drama'],
        status: 'completed',
      })
    );

    const manga = await comixAdapter.getMangaDetails!('detail-1');
    expect(manga).not.toBeNull();
    expect(manga!.title).toBe('Detail Manga');
    expect(manga!.sourceId).toBe('detail-1');
  });

  it('devuelve null cuando el manga no existe (404)', async () => {
    mockFetch.mockResolvedValueOnce(mockNotFoundResponse());

    const manga = await comixAdapter.getMangaDetails!('nonexistent');
    expect(manga).toBeNull();
  });

  it('devuelve null cuando hay error de red', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const manga = await comixAdapter.getMangaDetails!('any-id');
    expect(manga).toBeNull();
  });
});

describe('comixAdapter - getChapters', () => {
  it('obtiene capítulos filtrados por idioma español', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: {
          items: [
            {
              id: 'chapter-1',
              chapter: '1',
              title: 'Capítulo 1',
              language: 'es',
              link: '/title/manga/chapter/1',
            },
            {
              id: 'chapter-2',
              chapter: '2',
              title: 'Capítulo 2',
              language: 'en',
              link: '/title/manga/chapter/2',
            },
          ],
          pagination: { last_page: 1 },
        },
      })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'es');
    expect(chapters.length).toBe(1);
    expect(chapters[0].number).toBe('1');
    expect(chapters[0].title).toBe('Capítulo 1');
    expect(chapters[0].language).toBe('es');
  });

  it('obtiene capítulos en inglés cuando se solicita', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: {
          items: [
            {
              id: 'chapter-1',
              chapter: '1',
              title: 'Chapter 1',
              language: 'en',
              link: '/title/manga/chapter/1',
            },
          ],
          pagination: { last_page: 1 },
        },
      })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'en');
    expect(chapters.length).toBe(1);
    expect(chapters[0].language).toBe('en');
  });

  it('devuelve array vacío cuando no hay capítulos en el idioma solicitado', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: {
          items: [
            {
              id: 'chapter-1',
              chapter: '1',
              title: 'Capítulo 1',
              language: 'es',
              link: '/title/manga/chapter/1',
            },
          ],
          pagination: { last_page: 1 },
        },
      })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'en');
    expect(chapters).toEqual([]);
  });

  it('devuelve array vacío cuando no hay capítulos', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({ result: { items: [], pagination: { last_page: 1 } } })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'es');
    expect(chapters).toEqual([]);
  });

  it('maneja formato alternativo de respuesta sin result', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        items: [
          {
            id: 'chapter-1',
            chapter: '1',
            title: 'Capítulo 1',
            language: 'es',
            link: '/title/manga/chapter/1',
          },
        ],
      })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'es');
    expect(chapters.length).toBe(1);
  });

  it('excluye capítulos en japonés', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        result: {
          items: [
            {
              id: 'chapter-1',
              chapter: '1',
              title: 'Capítulo 1',
              language: 'ja',
              link: '/title/manga/chapter/1',
            },
          ],
          pagination: { last_page: 1 },
        },
      })
    );

    const chapters = await comixAdapter.getChapters!('manga-1', 'es');
    expect(chapters.length).toBe(0);
  });
});

describe('comixAdapter - getChapterPages', () => {
  it('obtiene páginas de un capítulo vía endpoint del servidor', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        chapterId: 'chapter-1',
        pages: [
          { id: 'page-1', imageUrl: '/api/comix/image?url=test1.jpg', order: 1 },
          { id: 'page-2', imageUrl: '/api/comix/image?url=test2.jpg', order: 2 },
          { id: 'page-3', imageUrl: '/api/comix/image?url=test3.jpg', order: 3 },
        ],
        totalPages: 3,
      })
    );

    const pages = await comixAdapter.getChapterPages!('chapter-1');
    expect(pages.length).toBe(3);
    expect(pages[0].order).toBe(1);
    expect(pages[1].order).toBe(2);
    expect(pages[2].order).toBe(3);
    expect(pages[0].imageUrl).toContain('/api/comix/image?url=');
  });

  it('devuelve array vacío cuando no hay páginas', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({ chapterId: 'chapter-1', pages: [], totalPages: 0 })
    );

    const pages = await comixAdapter.getChapterPages!('chapter-1');
    expect(pages).toEqual([]);
  });

  it('devuelve array vacío cuando el endpoint falla', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('failed to fetch'));

    const pages = await comixAdapter.getChapterPages!('chapter-1');
    expect(pages).toEqual([]);
  });

  it('extrae el ID original de Comix quitando prefijo comix-', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSuccessResponse({
        chapterId: 'chapter-1',
        pages: [
          { id: 'page-1', imageUrl: '/api/comix/image?url=test.jpg', order: 1 },
        ],
        totalPages: 1,
      })
    );

    await comixAdapter.getChapterPages!('comix-chapter-1');

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('/api/comix/chapter/chapter-1/pages');
    expect(callUrl).not.toContain('/api/comix/chapter/comix-chapter-1/pages');
  });
});

describe('ComixError', () => {
  it('crea error con propiedades correctas', () => {
    const err = new ComixError(
      ComixErrorType.NOT_FOUND,
      'No encontrado',
      404,
      false
    );
    expect(err.type).toBe(ComixErrorType.NOT_FOUND);
    expect(err.status).toBe(404);
    expect(err.retryable).toBe(false);
    expect(err.message).toBe('No encontrado');
  });

  it('todos los tipos de error están definidos', () => {
    expect(ComixErrorType.NOT_FOUND).toBe('COMIX_NOT_FOUND');
    expect(ComixErrorType.SERVER_ERROR).toBe('COMIX_SERVER_ERROR');
    expect(ComixErrorType.NETWORK_ERROR).toBe('COMIX_NETWORK_ERROR');
    expect(ComixErrorType.TIMEOUT_ERROR).toBe('COMIX_TIMEOUT_ERROR');
    expect(ComixErrorType.UNKNOWN_ERROR).toBe('COMIX_UNKNOWN_ERROR');
  });
});
