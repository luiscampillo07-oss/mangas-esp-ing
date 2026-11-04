import { MangaProvider } from '@/providers/interfaces';
import { Provider } from '@/models';

/**
 * Registro de proveedores disponibles.
 * Permite registrar adaptadores, obtener proveedores activos y comprobar disponibilidad.
 */
export class ProviderRegistry {
  private providers: Map<string, MangaProvider> = new Map();

  /**
   * Registra un nuevo proveedor en el sistema.
   */
  register(provider: MangaProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Obtiene un proveedor por su ID.
   */
  getProvider(id: string): MangaProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Devuelve todos los proveedores registrados como objetos Provider (para la UI).
   */
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiUrl: p.apiUrl,
      documentationUrl: p.documentationUrl,
      providerType: p.providerType,
      authenticationType: 'none',
      allowedLanguages: p.allowedLanguages,
      active: p.active,
      status: p.status,
    }));
  }

  /**
   * Devuelve solo los proveedores activos.
   */
  getActiveProviders(): MangaProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.active);
  }

  /**
   * Comprueba si existe un proveedor con el ID dado.
   */
  hasProvider(id: string): boolean {
    return this.providers.has(id);
  }
}

export const providerRegistry = new ProviderRegistry();
