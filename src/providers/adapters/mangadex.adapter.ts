import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';

const BASE_URL = 'https://api.mangadex.org';

/**
 * Helper para hacer peticiones a la API de MangaDex con timeout y manejo de errores.
 */
async function fetchMangaDex<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normaliza un objeto manga de MangaDex al modelo interno.
 */
function normalizeManga(manga: any): Manga {
  const title = manga.attributes.title?.en || manga.attributes.title?.['es-la'] || Object.values(manga.attributes.title || {})[0] || 'Sin título';
  const description = manga.attributes.description?.en || manga.attributes.description?.['es-la'] || manga.attributes.description?.es;
  const coverRelationship = manga.relationships?.find((r: any) => r.type === 'cover_art');
  const coverFileName = coverRelationship?.attributes?.fileName;
  const coverUrl = coverFileName
    ? `${BASE_URL}/cover/${manga.id}/${coverFileName}`
    : undefined;

  return {
    id: `mangadex-${manga.id}`,
    slug: manga.attributes.slug || manga.id,
    title,
    description: description || undefined,
    cover: coverUrl,
    author: undefined, // Se resuelve vía relaciones si es necesario
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
    try {
      await fetchMangaDex<{ result: string }>('/ping');
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
    const langParam = language === 'es' ? 'translatedLanguage[]=es&translatedLanguage[]=es-la' : `translatedLanguage[]=${language}`;
    const data = await fetchMangaDex<any>(
      `/manga/${sourceId}/feed?${langParam}&limit=100&order[chapter]=asc`
    );
    return (data.data || []).map((c: any) => normalizeChapter(c, sourceId));
  },

  async getChapterPages(chapterId: string): Promise<Page[]> {
    try {
      // Obtener información del servidor de imágenes (at-home server)
      const serverData = await fetchMangaDex<any>(`/at-home/server/${chapterId}`);

      const baseUrl = serverData.baseUrl;
      const hash = serverData.chapter.hash;
      const pages = serverData.chapter.data || []; // Array de nombres de archivo
      const dataSaver = serverData.chapter.dataSaver || [];

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
