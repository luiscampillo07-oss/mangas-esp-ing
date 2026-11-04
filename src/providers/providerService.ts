import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';
import { providerRegistry } from '@/providers/registry';

/**
 * Servicio de proveedores: orquesta las llamadas a los adaptadores registrados,
 * tolerante a fallos (si un proveedor falla, los demás continúan).
 */
export class ProviderService {
  /**
   * Obtiene el catálogo consolidado de todos los proveedores activos.
   * Elimina duplicados por sourceId.
   */
  async getCatalog(page = 1, limit = 20): Promise<Manga[]> {
    const providers = providerRegistry.getActiveProviders();
    const results: Manga[] = [];

    // Ejecutar llamadas en paralelo, tolerando fallos individuales
    const outcomes = await Promise.allSettled(
      providers.map(async (p) => {
        if (!p.getCatalog) return [];
        try {
          return await p.getCatalog(page, limit);
        } catch (error) {
          console.error(`[ProviderService] Error en getCatalog de ${p.id}:`, error);
          return [];
        }
      })
    );

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        results.push(...outcome.value);
      }
    });

    return this.deduplicate(results);
  }

  /**
   * Busca mangas por título en todos los proveedores activos.
   */
  async searchManga(query: string): Promise<Manga[]> {
    if (!query.trim()) return [];

    const providers = providerRegistry.getActiveProviders();
    const results: Manga[] = [];

    const outcomes = await Promise.allSettled(
      providers.map(async (p) => {
        if (!p.searchManga) return [];
        try {
          return await p.searchManga(query);
        } catch (error) {
          console.error(`[ProviderService] Error en searchManga de ${p.id}:`, error);
          return [];
        }
      })
    );

    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') {
        results.push(...outcome.value);
      }
    });

    return this.deduplicate(results);
  }

  /**
   * Obtiene los detalles de un manga desde el proveedor que lo contiene.
   * Se busca en todos los proveedores activos hasta encontrarlo.
   */
  async getMangaDetails(sourceId: string): Promise<Manga | null> {
    const providers = providerRegistry.getActiveProviders();

    for (const p of providers) {
      if (!p.getMangaDetails) continue;
      try {
        const manga = await p.getMangaDetails(sourceId);
        if (manga) return manga;
      } catch (error) {
        console.error(`[ProviderService] Error en getMangaDetails de ${p.id}:`, error);
      }
    }

    return null;
  }

  /**
   * Obtiene los capítulos de un manga filtrados por idioma.
   * Prioriza capítulos en español si se solicita.
   */
  async getChapters(
    sourceId: string,
    language = 'es'
  ): Promise<Chapter[]> {
    const providers = providerRegistry.getActiveProviders();

    for (const p of providers) {
      if (!p.getChapters) continue;
      try {
        const chapters = await p.getChapters(sourceId, language);
        if (chapters && chapters.length > 0) {
          return chapters;
        }
      } catch (error) {
        console.error(`[ProviderService] Error en getChapters de ${p.id}:`, error);
      }
    }

    return [];
  }

  /**
   * Obtiene las páginas de un capítulo.
   */
  async getChapterPages(chapterId: string): Promise<Page[]> {
    const providers = providerRegistry.getActiveProviders();

    for (const p of providers) {
      if (!p.getChapterPages) continue;
      try {
        const pages = await p.getChapterPages(chapterId);
        if (pages && pages.length > 0) {
          return pages;
        }
      } catch (error) {
        console.error(`[ProviderService] Error en getChapterPages de ${p.id}:`, error);
      }
    }

    return [];
  }

  /**
   * Elimina mangas duplicados basándose en sourceId y título similar.
   * No une automáticamente cuando existe incertidumbre.
   */
  private deduplicate(mangas: Manga[]): Manga[] {
    const seen = new Map<string, Manga>();

    for (const manga of mangas) {
      const key = manga.sourceId;
      if (!seen.has(key)) {
        seen.set(key, manga);
      }
    }

    return Array.from(seen.values());
  }
}

export const providerService = new ProviderService();
