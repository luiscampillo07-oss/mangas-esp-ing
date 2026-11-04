import { providerRegistry } from '@/providers/registry';
import { mangadexAdapter } from '@/providers/adapters';

/**
 * Registra todos los proveedores aprobados en el sistema.
 * Solo se registran proveedores que han sido investigados y verificados.
 */
export function registerProviders(): void {
  providerRegistry.register(mangadexAdapter);
}
