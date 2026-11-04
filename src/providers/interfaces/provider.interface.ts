import { Manga, Chapter, Page, Provider } from '@/models';

/**
 * Interfaz común que todo adaptador de proveedor debe implementar.
 * Cada adaptador implementa únicamente las funcionalidades que el proveedor realmente ofrece.
 */
export interface MangaProvider {
  /** Identificador único del proveedor */
  readonly id: string;
  /** Nombre legible del proveedor */
  readonly name: string;
  /** Indica si el proveedor está activo y disponible */
  readonly active: boolean;
  /** Estado actual del proveedor (APPROVED, INTEGRATED, DISABLED, etc.) */
  readonly status: string;
  /** Tipos de proveedor según clasificación */
  readonly providerType: string[];
  /** Idiomas soportados por el proveedor */
  readonly allowedLanguages: string[];
  /** Documentación oficial */
  readonly documentationUrl: string;
  /** URL base de la API */
  readonly baseUrl: string;
  /** URL de la API si es diferente de baseUrl */
  readonly apiUrl?: string;

  /**
   * Comprueba si el proveedor está disponible respondiendo a un endpoint sencillo.
   */
  checkAvailability(): Promise<boolean>;

  /**
   * Obtiene el catálogo de mangas disponibles.
   * @param page - Número de página para paginación
   * @param limit - Cantidad de resultados por página
   */
  getCatalog?(page?: number, limit?: number): Promise<Manga[]>;

  /**
   * Busca mangas por título.
   * @param query - Término de búsqueda
   */
  searchManga?(query: string): Promise<Manga[]>;

  /**
   * Obtiene los detalles de un manga por su ID externo.
   * @param sourceId - ID del manga en el proveedor
   */
  getMangaDetails?(sourceId: string): Promise<Manga | null>;

  /**
   * Obtiene los capítulos de un manga, filtrados por idioma si se especifica.
   * @param sourceId - ID del manga en el proveedor
   * @param language - Código de idioma (ej: 'es', 'en', 'ja')
   */
  getChapters?(sourceId: string, language?: string): Promise<Chapter[]>;

  /**
   * Obtiene las páginas de un capítulo con sus URLs de imagen.
   * @param chapterId - ID del capítulo en el proveedor
   */
  getChapterPages?(chapterId: string): Promise<Page[]>;
}
