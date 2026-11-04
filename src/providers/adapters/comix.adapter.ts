import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';
import {
  normalizeLanguage,
  isSupportedLanguage,
  getLanguageName,
} from '@/utils/language';

/**
 * URL base de Comix API.
 * Comix API es un proxy para manga/manhwa con bypass de CORS integrado.
 * Todas las imágenes vienen envueltas en /api/image?url=... para evitar bloqueos de CORS.
 *
 * Documentación: https://github.com/yurtzy/comix-api
 * Instancia pública: https://comix-api.vercel.app
 */
const BASE_URL = process.env.NEXT_PUBLIC_COMIX_API_URL || 'https://comix-api.vercel.app/api/manga';
const COMIX_ROOT = BASE_URL.replace('/api/manga', '');

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
 * Construye una URL de imagen de portada usando el proxy de imágenes de Comix API.
 * Comix API devuelve rutas como /images/covers/xxx.jpg que necesitan el proxy /api/image.
 */
function buildCoverUrl(imgPath: string | undefined): string | undefined {
  if (!imgPath) return undefined;

  // Si ya es una URL completa, usarla directamente
  if (imgPath.startsWith('http')) return imgPath;

  // Si ya incluye /api/image, usar como está
  if (imgPath.startsWith('/api/image')) return `${COMIX_ROOT}${imgPath}`;

  // Ruta relativa: envolver en el proxy de imágenes de Comix API
  const normalizedPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
  return `${COMIX_ROOT}/api/image?url=${encodeURIComponent(COMIX_ROOT + normalizedPath)}`;
}

/**
 * Normaliza un idioma de Comix API a su forma canónica (es, en o null).
 */
function normalizeComixLanguage(languageRaw: any): string | null {
  if (!languageRaw) return null;
  return normalizeLanguage(String(languageRaw)) ?? null;
}

/**
 * Normaliza un manga de Comix API al modelo interno.
 * Solo incluye mangas que tengan capítulos disponibles en español o inglés.
 * El idioma del manga se determina por los capítulos disponibles.
 */
function normalizeManga(manga: any): Manga {
  const coverUrl = buildCoverUrl(manga.img);

  return {
    id: `comix-${manga.id || manga.link?.replace('/title/', '') || ''}`,
    slug: manga.id || '',
    title: manga.title || 'Sin título',
    description: undefined,
    cover: coverUrl,
    author: undefined,
    genres: Array.isArray(manga.genres) ? manga.genres : [],
    status: manga.status || undefined,
    language: 'es', // Idioma por defecto del catálogo, se filtra por capítulos
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
 * Aplica normalización de idioma y filtra solo español e inglés.
 */
function normalizeChapter(chapter: any, mangaId: string): Chapter | null {
  const languageRaw = chapter.language || chapter.lang || chapter.translatedLanguage;
  const normalizedLang = normalizeComixLanguage(languageRaw);

  // Solo incluir capítulos en español o inglés
  if (!normalizedLang || !isSupportedLanguage(normalizedLang)) {
    return null;
  }

  // Extraer el ID original de Comix (sin prefijo comix-) para usar en getChapterPages
  const originalId = chapter.id || chapter.link || chapter.chapter || '';

  return {
    id: `comix-${originalId}`,
    mangaId,
    number: chapter.chapter || chapter.number || undefined,
    title: chapter.title || undefined,
    publishedAt: chapter.publishedAt || chapter.releaseDate || undefined,
    language: normalizedLang,
    sourceUrl: chapter.link ? `https://comix-api.vercel.app${chapter.link}` : undefined,
    translationSource: undefined,
    pages: [], // Las páginas se cargan por separado vía getChapterPages
  };
}

export const comixAdapter: MangaProvider = {
  id: 'comix',
  name: 'Comix API',
  active: true,
  status: 'APPROVED',
  providerType: ['Metadata Provider', 'Cover Provider', 'Chapter Provider', 'Page Provider'],
  allowedLanguages: ['es', 'en'],
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
    // sourceId puede venir con prefijo 'comix-', extraer el ID real de Comix
    let realSourceId = sourceId;
    if (realSourceId.startsWith('comix-')) {
      realSourceId = realSourceId.replace(/^comix-/, '');
    }

    const data = await fetchComix<any>(`/${realSourceId}/chapters?page=1&limit=100&sfw=true`);
    const result = data.result || data;
    const items: any[] = result.items || result || [];

    const normalizedChapters: Chapter[] = [];
    for (const item of items) {
      const normalized = normalizeChapter(item, sourceId);
      if (normalized) {
        // Filtrar por idioma solicitado
        if (language === 'es' && normalized.language === 'es') {
          normalizedChapters.push(normalized);
        } else if (language === 'en' && normalized.language === 'en') {
          normalizedChapters.push(normalized);
        } else if (language === 'all' || !language) {
          normalizedChapters.push(normalized);
        }
      }
    }

    // Ordenar por número de capítulo descendente (más reciente primero)
    normalizedChapters.sort((a, b) => {
      const aNum = parseFloat(a.number || '0');
      const bNum = parseFloat(b.number || '0');
      if (aNum !== bNum) return bNum - aNum;
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    });

    return normalizedChapters;
  },

  async getChapterPages(chapterId: string): Promise<Page[]> {
    try {
      // Extraer el ID original de Comix (quitando prefijo comix-)
      let realChapterId = chapterId;
      if (realChapterId.startsWith('comix-')) {
        realChapterId = realChapterId.replace(/^comix-/, '');
      }

      // Llamar al endpoint de páginas de Comix API a través de nuestro proxy del servidor
      const response = await fetch(`/api/comix/chapter/${encodeURIComponent(realChapterId)}/pages`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[ComixAdapter] Chapter pages endpoint returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      const pages: Page[] = data.pages || [];

      return pages;
    } catch (error) {
      console.error('[ComixAdapter] Error getting chapter pages:', error);
      return [];
    }
  },
};
