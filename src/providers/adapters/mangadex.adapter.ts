import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';

const BASE_URL = 'https://api.mangadex.org';

/**
 * Headers completos requeridos por MangaDex para evitar bloqueos.
 * Incluye User-Agent, Referer y Accept-Language para simular un navegador real.
 */
const MANGADEX_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MangasApp/1.0.0',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  Referer: 'https://mangadex.org/',
  Origin: 'https://mangadex.org',
};

/**
 * Tipos de error reconocidos del adaptador MangaDex.
 */
export enum MangaDexErrorType {
  FORBIDDEN = 'MANGADEX_FORBIDDEN', // 403 - Bloqueado por MangaDex
  RATE_LIMITED = 'MANGADEX_RATE_LIMITED', // 429 - Demasiadas peticiones
  NOT_FOUND = 'MANGADEX_NOT_FOUND', // 404 - Recurso no existe
  SERVER_ERROR = 'MANGADEX_SERVER_ERROR', // 5xx - Error del servidor
  NETWORK_ERROR = 'MANGADEX_NETWORK_ERROR', // Error de red / DNS / CORS
  TIMEOUT_ERROR = 'MANGADEX_TIMEOUT_ERROR', // Tiempo de espera agotado
  UNKNOWN_ERROR = 'MANGADEX_UNKNOWN_ERROR', // Error no clasificado
}

/**
 * Error tipado de MangaDex.
 */
export class MangaDexError extends Error {
  readonly type: MangaDexErrorType;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    type: MangaDexErrorType,
    message: string,
    status?: number,
    retryable = false
  ) {
    super(message);
    this.name = 'MangaDexError';
    this.type = type;
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Clase de utilidad para delays (sleep).
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determina si un error HTTP es retryable según el código de estado.
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Helper para hacer peticiones a la API de MangaDex con reintentos, timeout y manejo detallado de errores.
 */
async function fetchMangaDex<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...MANGADEX_HEADERS,
          ...options.headers,
        },
      });

      // Si la respuesta no es válida (undefined o sin status), tratar como error de red
      if (!response || typeof response.status !== 'number') {
        throw new TypeError('Invalid response from fetch');
      }

      // 403 Forbidden - No retryable, MangaDex bloquea el cliente
      if (response.status === 403) {
        throw new MangaDexError(
          MangaDexErrorType.FORBIDDEN,
          'MangaDex ha bloqueado el acceso desde esta dirección. Verifique que MangaDex permita solicitudes desde su entorno.',
          403,
          false
        );
      }

      // 429 Rate Limited - Retryable con backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 300;
        if (attempt < retries) {
          await sleep(waitTime);
          continue;
        }
        throw new MangaDexError(
          MangaDexErrorType.RATE_LIMITED,
          'Se ha excedido el límite de peticiones de MangaDex. Inténtelo de nuevo más tarde.',
          429,
          false
        );
      }

      // 404 Not Found - No retryable
      if (response.status === 404) {
        throw new MangaDexError(
          MangaDexErrorType.NOT_FOUND,
          'El recurso solicitado no existe en MangaDex.',
          404,
          false
        );
      }

      // 5xx Server Error - Retryable
      if (response.status >= 500) {
        if (attempt < retries && isRetryableStatus(response.status)) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new MangaDexError(
          MangaDexErrorType.SERVER_ERROR,
          `Error del servidor de MangaDex (${response.status}). Inténtelo de nuevo más tarde.`,
          response.status,
          false
        );
      }

      // Cualquier otro error HTTP no 2xx
      if (!response.ok) {
        throw new MangaDexError(
          MangaDexErrorType.UNKNOWN_ERROR,
          `MangaDex API error: ${response.status} ${response.statusText}`,
          response.status,
          false
        );
      }

      return await response.json();
    } catch (error) {
      // Si es un MangaDexError no retryable, lanzar inmediatamente
      if (error instanceof MangaDexError && !error.retryable) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // Error de red (fetch falló, DNS, CORS, etc.)
      // Cualquier TypeError durante fetch se trata como error de red
      if (error instanceof TypeError) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new MangaDexError(
          MangaDexErrorType.NETWORK_ERROR,
          'Error de red al conectar con MangaDex. Verifique su conexión a internet.',
          undefined,
          false
        );
      }

      // Error de timeout (AbortError o TimeoutError)
      if (
        error instanceof DOMException &&
        (error.name === 'AbortError' || error.name === 'TimeoutError')
      ) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 300);
          continue;
        }
        throw new MangaDexError(
          MangaDexErrorType.TIMEOUT_ERROR,
          'El tiempo de espera de MangaDex se ha agotado.',
          undefined,
          false
        );
      }

      // Error desconocido, no reintentar
      throw error;
    } finally {
      if (attempt === retries) {
        clearTimeout(timeoutId);
      }
    }
  }

  throw lastError || new MangaDexError(MangaDexErrorType.UNKNOWN_ERROR, 'Error desconocido de MangaDex.');
}

/**
 * Normaliza un objeto manga de MangaDex al modelo interno.
 */
function normalizeManga(manga: any): Manga {
  const titles = manga.attributes.title || {};
  const title =
    titles?.en ||
    titles?.['es-la'] ||
    Object.values(titles)[0] ||
    'Sin título';

  const descriptions = manga.attributes.description || {};
  const description =
    descriptions?.en ||
    descriptions?.['es-la'] ||
    descriptions?.es ||
    undefined;

  const coverRelationship = manga.relationships?.find((r: any) => r.type === 'cover_art');
  const coverFileName = coverRelationship?.attributes?.fileName;
  const coverUrl = coverFileName ? `${BASE_URL}/cover/${manga.id}/${coverFileName}` : undefined;

  // Extraer autor/artista de las relaciones
  const authorRelationship = manga.relationships?.find(
    (r: any) => r.type === 'author' || r.type === 'artist'
  );
  const author = authorRelationship?.attributes?.name || undefined;

  return {
    id: `mangadex-${manga.id}`,
    slug: manga.attributes.slug || manga.id,
    title,
    description,
    cover: coverUrl,
    author,
    genres: (manga.attributes.tags || [])
      .filter((t: any) => t.group === 'genre' || t.group === 'theme')
      .map((t: any) => t.name?.en || t.name),
    status: manga.attributes.status,
    language: 'es',
    sourceId: manga.id,
    sourceUrl: `https://mangadex.org/title/${manga.id}`,
    license: undefined,
    licenseUrl: undefined,
    chapters: [],
    updatedAt: manga.attributes.updatedAt,
  };
}

/**
 * Normaliza un objeto capítulo de MangaDex al modelo interno.
 */
function normalizeChapter(chapter: any, mangaId: string): Chapter {
  return {
    id: `mangadex-${chapter.id}`,
    mangaId,
    number: chapter.attributes.chapter || undefined,
    title: chapter.attributes.title || undefined,
    publishedAt: chapter.attributes.publishAt || undefined,
    language: chapter.attributes.translatedLanguage || 'en',
    sourceUrl: `https://mangadex.org/chapter/${chapter.id}`,
    translationSource: chapter.relationships?.find((r: any) => r.type === 'scanlation_group')?.id,
    pages: [], // Las páginas se cargan por separado vía getChapterPages
  };
}

export const mangadexAdapter: MangaProvider = {
  id: 'mangadex',
  name: 'MangaDex',
  active: true,
  status: 'APPROVED',
  providerType: ['Metadata Provider', 'Cover Provider', 'Chapter Provider', 'Page Provider'],
  allowedLanguages: ['es', 'es-la', 'en', 'ja'],
  baseUrl: BASE_URL,
  documentationUrl: 'https://api.mangadex.org/docs/redoc.html',

  async checkAvailability(): Promise<boolean> {
    // checkAvailability no reintenta: verificación rápida de disponibilidad
    try {
      await fetchMangaDex<{ result: string }>('/ping', {}, 0);
      return true;
    } catch {
      return false;
    }
  },

  async getCatalog(page = 1, limit = 20): Promise<Manga[]> {
    const offset = (page - 1) * limit;
    const data = await fetchMangaDex<any>(
      `/manga?limit=${limit}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive`
    );
    return (data.data || []).map((m: any) => normalizeManga(m));
  },

  async searchManga(query: string): Promise<Manga[]> {
    const data = await fetchMangaDex<any>(
      `/manga?title=${encodeURIComponent(query)}&limit=20&contentRating[]=safe&contentRating[]=suggestive`
    );
    return (data.data || []).map((m: any) => normalizeManga(m));
  },

  async getMangaDetails(sourceId: string): Promise<Manga | null> {
    try {
      const data = await fetchMangaDex<any>(`/manga/${sourceId}`);
      return normalizeManga(data.data);
    } catch {
      return null;
    }
  },

  async getChapters(sourceId: string, language = 'es'): Promise<Chapter[]> {
    // MangaDex permite filtrar capítulos por idioma de traducción
    const langParam =
      language === 'es'
        ? 'translatedLanguage[]=es&translatedLanguage[]=es-la'
        : `translatedLanguage[]=${language}`;
    const data = await fetchMangaDex<any>(
      `/manga/${sourceId}/feed?${langParam}&limit=100&order[chapter]=asc`
    );
    const chapters = (data.data || []).map((c: any) =>
      normalizeChapter(c, sourceId)
    );
    // Capa adicional de filtrado por idioma en el cliente
    // para garantizar que solo se devuelvan capítulos del idioma solicitado
    return chapters.filter((c: Chapter) => {
      if (language === 'es') {
        return c.language === 'es' || c.language === 'es-la';
      }
      return c.language === language;
    });
  },

  async getChapterPages(chapterId: string): Promise<Page[]> {
    try {
      // Obtener información del servidor de imágenes (at-home server)
      const serverData = await fetchMangaDex<any>(`/at-home/server/${chapterId}`);

      const baseUrl = serverData.baseUrl;
      const hash = serverData.chapter.hash;
      const pages = serverData.chapter.data || []; // Array de nombres de archivo

      return pages.map((fileName: string, index: number) => {
        // Las URLs de imagen se construyen para pasar por nuestro proxy (evitar CORS de MangaDex)
        const imageUrl = `/api/manga-dex/image?baseUrl=${encodeURIComponent(baseUrl)}&hash=${encodeURIComponent(hash)}&file=${encodeURIComponent(fileName)}&quality=data`;

        return {
          id: `mangadex-page-${chapterId}-${index}`,
          imageUrl,
          order: index + 1,
          sourceUrl: `https://mangadex.org/chapter/${chapterId}`,
          license: undefined,
        };
      });
    } catch {
      return [];
    }
  },
};
