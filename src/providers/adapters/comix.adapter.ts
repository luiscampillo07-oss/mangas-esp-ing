import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';

/**
 * URL base de Comix API.
 * Comix API es un proxy para manga/manhwa con bypass de CORS integrado.
 * Todas las imágenes vienen envueltas en /api/image?url=... para evitar bloqueos de CORS.
 * Soporta múltiples idiomas incluyendo es, es-la, en, ja.
 *
 * Documentación: https://github.com/yurtzy/comix-api
 * Instancia pública: https://comix-api.vercel.app
 */
const BASE_URL = process.env.NEXT_PUBLIC_COMIX_API_URL || 'https://comix-api.vercel.app/api/manga';

/**
 * Tipos de error reconocidos del adaptador Comix.
 */
export enum ComixErrorType {
  NOT_FOUND = 'COMIX_NOT_FOUND',
  SERVER_ERROR = 'COMIX_SERVER_ERROR',
  NETWORK_ERROR = 'COMIX_NETWORK_ERROR',
  TIMEOUT_ERROR = 'COMIX_TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'COMIX_UNKNOWN_ERROR',
}

/**
 * Error tipado de Comix API.
 */
export class ComixError extends Error {
  readonly type: ComixErrorType;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    type: ComixErrorType,
    message: string,
    status?: number,
    retryable = false
  ) {
    super(message);
    this.name = 'ComixError';
    this.type = type;
    this.status = status;
    this.retryable = retryable;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Helper para hacer peticiones a Comix API con reintentos y timeout.
 */
async function fetchComix<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (!response || typeof response.status !== 'number') {
        throw new TypeError('Invalid response from fetch');
      }

      if (response.status === 404) {
        throw new ComixError(
          ComixErrorType.NOT_FOUND,
          'El recurso solicitado no existe en Comix API.',
          404,
          false
        );
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 300;
        if (attempt < retries) {
          await sleep(waitTime);
          continue;
        }
        throw new ComixError(
          ComixErrorType.UNKNOWN_ERROR,
          'Límite de peticiones excedido en Comix API.',
          429,
          false
        );
      }

      if (response.status >= 500) {
        if (attempt < retries && isRetryableStatus(response.status)) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new ComixError(
          ComixErrorType.SERVER_ERROR,
          `Error del servidor de Comix API (${response.status}).`,
          response.status,
          false
        );
      }

      if (!response.ok) {
        throw new ComixError(
          ComixErrorType.UNKNOWN_ERROR,
          `Comix API error: ${response.status} ${response.statusText}`,
          response.status,
          false
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ComixError && !error.retryable) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof TypeError) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new ComixError(
          ComixErrorType.NETWORK_ERROR,
          'Error de red al conectar con Comix API.',
          undefined,
          false
        );
      }

      if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new ComixError(
          ComixErrorType.TIMEOUT_ERROR,
          'Tiempo de espera agotado en Comix API.',
          undefined,
          false
        );
      }

      throw error;
    } finally {
      if (attempt === retries) {
        clearTimeout(timeoutId);
      }
    }
  }

  throw lastError || new ComixError(ComixErrorType.UNKNOWN_ERROR, 'Error desconocido de Comix API.');
}

/**
 * Normaliza un manga de Comix API al modelo interno.
 */
function normalizeManga(manga: any): Manga {
  return {
    id: `comix-${manga.id || manga.link?.replace('/title/', '') || ''}`,
    slug: manga.id || '',
    title: manga.title || 'Sin título',
    description: undefined,
    cover: manga.img ? `${BASE_URL.replace('/api/manga', '')}/api/image?url=${encodeURIComponent(manga.img)}` : undefined,
    author: undefined,
    genres: Array.isArray(manga.genres) ? manga.genres : [],
    status: manga.status || undefined,
    language: 'es',
    sourceId: manga.id || '',
    sourceUrl: manga.link ? `https://comix-api.vercel.app${manga.link}` : undefined,
    license: undefined,
    licenseUrl: undefined,
    chapters: [],
    updatedAt: undefined,
  };
}

/**
 * Normaliza un capítulo de Comix API al modelo interno.
 */
function normalizeChapter(chapter: any, mangaId: string): Chapter {
  return {
    id: `comix-${chapter.id || chapter.link || chapter.chapter || ''}`,
    mangaId,
    number: chapter.chapter || chapter.number || undefined,
    title: chapter.title || undefined,
    publishedAt: undefined,
    language: 'es',
    sourceUrl: chapter.link ? `https://comix-api.vercel.app${chapter.link}` : undefined,
    translationSource: undefined,
    pages: [],
  };
}

export const comixAdapter: MangaProvider = {
  id: 'comix',
  name: 'Comix API',
  active: true,
  status: 'APPROVED',
  providerType: ['Metadata Provider', 'Cover Provider', 'Chapter Provider', 'Page Provider'],
  allowedLanguages: ['es', 'es-la', 'en', 'ja'],
  baseUrl: BASE_URL,
  documentationUrl: 'https://github.com/yurtzy/comix-api',

  async checkAvailability(): Promise<boolean> {
    try {
      await fetchComix<{ popular: any[] }>('/home?sfw=true', {}, 0);
      return true;
    } catch {
      return false;
    }
  },

  async getCatalog(page = 1, limit = 20): Promise<Manga[]> {
    // Comix API /home devuelve los mangas más populares y recientes
    const data = await fetchComix<any>(`/home?sfw=true&page=${page}&limit=${limit}`);
    const mangas: any[] = [];

    if (data.popular && Array.isArray(data.popular)) {
      mangas.push(...data.popular);
    }
    if (data.latest && Array.isArray(data.latest)) {
      mangas.push(...data.latest);
    }

    return mangas.map((m: any) => normalizeManga(m)).slice(0, limit);
  },

  async searchManga(query: string): Promise<Manga[]> {
    const data = await fetchComix<any>(`/search?q=${encodeURIComponent(query)}&sfw=true`);
    const results: any[] = data.results || [];
    return results.map((m: any) => normalizeManga(m));
  },

  async getMangaDetails(sourceId: string): Promise<Manga | null> {
    try {
      const data = await fetchComix<any>(`/${sourceId}?sfw=true`);
      if (data.error) return null;
      return normalizeManga(data);
    } catch {
      return null;
    }
  },

  async getChapters(sourceId: string, language = 'es'): Promise<Chapter[]> {
    const data = await fetchComix<any>(`/${sourceId}/chapters?page=1&limit=100&sfw=true`);
    const result = data.result || data;
    const items: any[] = result.items || result || [];
    return items.map((c: any) => normalizeChapter(c, sourceId));
  },

  async getChapterPages(chapterId: string): Promise<Page[]> {
    try {
      // Comix API requiere chapterId para obtener las imágenes del capítulo
      const data = await fetchComix<any>(`/read?chapterId=${encodeURIComponent(chapterId)}&sfw=true`);
      const images: any[] = data.images || [];
      const proxyBase = BASE_URL.replace('/api/manga', '');

      return images.map((img: any, index: number) => {
        let imageUrl = '';
        if (img.url) {
          if (img.url.startsWith('http')) {
            // URL absoluta completa - usarla directamente
            imageUrl = img.url;
          } else if (img.url.startsWith('/api/image')) {
            // Ya es una URL de proxy de Comix API
            imageUrl = `${proxyBase}${img.url}`;
          } else if (img.url.startsWith('/')) {
            // Ruta relativa del servidor - envolver en proxy de imágenes
            imageUrl = `${proxyBase}/api/image?url=${encodeURIComponent(proxyBase + img.url)}`;
          } else {
            // Ruta relativa sin barra inicial
            imageUrl = `${proxyBase}/api/image?url=${encodeURIComponent(proxyBase + '/' + img.url)}`;
          }
        }

        return {
          id: `comix-page-${chapterId}-${index}`,
          imageUrl,
          order: index + 1,
          sourceUrl: undefined,
          license: undefined,
        };
      });
    } catch {
      return [];
    }
  },
};
