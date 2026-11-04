import { MangaProvider } from '@/providers/interfaces';
import { Manga, Chapter, Page } from '@/models';
import { providerRegistry } from '@/providers/registry';

/**
 * Estado de un intento de proveedor.
 */
interface ProviderAttempt {
  providerId: string;
  providerName: string;
  success: boolean;
  error?: string;
  results?: any[];
}

/**
 * Servicio de proveedores: orquesta las llamadas a los adaptadores registrados,
 * tolerante a fallos (si un proveedor falla, los demás continúan).
 */
export class ProviderService {
  /**
   * Obtiene el catálogo consolidado de todos los proveedores activos.
   * Los capítulos solo se cargan cuando el usuario entra a la ficha del manga,
   * no en el catálogo inicial (sería demasiado lento con peticiones secuenciales).
   */
  async getCatalog(page = 1, limit = 20): Promise<Manga[]> {
    const providers = providerRegistry.getActiveProviders();
    const results: Manga[] = [];
    const attempts: ProviderAttempt[] = [];

    // Ejecutar llamadas en paralelo, tolerando fallos individuales
    const outcomes = await Promise.allSettled(
      providers.map(async (p) => {
        if (!p.getCatalog) {
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: false,
            error: 'El proveedor no soporta getCatalog',
          });
          return [];
        }
        try {
          const data = await p.getCatalog(page, limit);
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: true,
            results: data,
          });
          return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: false,
            error: message,
          });
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

    const deduped = this.deduplicate(results);

    // Cargar capítulos en español e inglés para cada manga (en paralelo)
    // para filtrar solo aquellos que tienen capítulos en idiomas soportados
    const mangasWithChapters: Manga[] = [];
    const chapterOutcomes = await Promise.allSettled(
      deduped.map(async (manga) => {
        try {
          const chapters = await this.getChapters(manga.sourceId, 'all');
          if (chapters.length > 0) {
            return { ...manga, chapters };
          }
          // Manga sin capítulos disponibles en español ni inglés - excluir
          return null;
        } catch {
          return null;
        }
      })
    );

    chapterOutcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled' && outcome.value) {
        mangasWithChapters.push(outcome.value);
      }
    });

    const realFailures = attempts.filter(
      (a) => !a.success && a.error !== 'El proveedor no soporta getCatalog'
    );
    const allFailed =
      realFailures.length > 0 &&
      realFailures.length === attempts.filter((a) => a.error !== 'El proveedor no soporta getCatalog').length;

    if (providers.length > 0 && mangasWithChapters.length === 0 && allFailed) {
      const failedProviders = realFailures.map((a) => a.providerName).join(', ');
      throw new Error(
        `No se pudo cargar el catálogo. Todos los proveedores fallaron: ${failedProviders}. Inténtelo de nuevo más tarde.`
      );
    }

    return mangasWithChapters;
  }

  /**
   * Busca mangas por título en todos los proveedores activos.
   */
  async searchManga(query: string): Promise<Manga[]> {
    if (!query.trim()) return [];

    const providers = providerRegistry.getActiveProviders();
    const results: Manga[] = [];
    const attempts: ProviderAttempt[] = [];

    const outcomes = await Promise.allSettled(
      providers.map(async (p) => {
        if (!p.searchManga) {
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: false,
            error: 'El proveedor no soporta searchManga',
          });
          return [];
        }
        try {
          const data = await p.searchManga(query);
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: true,
            results: data,
          });
          return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          attempts.push({
            providerId: p.id,
            providerName: p.name,
            success: false,
            error: message,
          });
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

    const deduped = this.deduplicate(results);

    // Cargar capítulos en español e inglés para cada resultado (en paralelo)
    const mangasWithChapters: Manga[] = [];
    const chapterOutcomes = await Promise.allSettled(
      deduped.map(async (manga) => {
        try {
          const chapters = await this.getChapters(manga.sourceId, 'all');
          if (chapters.length > 0) {
            return { ...manga, chapters };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    chapterOutcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled' && outcome.value) {
        mangasWithChapters.push(outcome.value);
      }
    });

    const realFailures = attempts.filter(
      (a) => !a.success && a.error !== 'El proveedor no soporta searchManga'
    );
    const allFailed =
      realFailures.length > 0 &&
      realFailures.length === attempts.filter((a) => a.error !== 'El proveedor no soporta searchManga').length;

    if (providers.length > 0 && mangasWithChapters.length === 0 && allFailed) {
      const failedProviders = realFailures.map((a) => a.providerName).join(', ');
      throw new Error(
        `No se pudo realizar la búsqueda. Todos los proveedores fallaron: ${failedProviders}. Inténtelo de nuevo más tarde.`
      );
    }

    return mangasWithChapters;
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
        if (manga) {
          // Intentar cargar capítulos para el detalle
          try {
            const chapters = await this.getChapters(sourceId, 'es');
            return { ...manga, chapters };
          } catch {
            return manga;
          }
        }
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
   * Comprueba la disponibilidad de todos los proveedores activos.
   */
  async checkAllProvidersAvailability(): Promise<Record<string, boolean>> {
    const providers = providerRegistry.getActiveProviders();
    const results: Record<string, boolean> = {};

    for (const p of providers) {
      try {
        results[p.id] = await p.checkAvailability();
      } catch {
        results[p.id] = false;
      }
    }

    return results;
  }

  /**
   * Elimina mangas duplicados basándose en sourceId.
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
