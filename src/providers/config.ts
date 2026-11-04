import { providerRegistry } from '@/providers/registry';
import { mangadexAdapter } from '@/providers/adapters/mangadex.adapter';
import { comixAdapter } from '@/providers/adapters/comix.adapter';

/**
 * Registra todos los proveedores aprobados en el sistema.
 *
 * MangaDex está marcado como DISABLED porque bloquea solicitudes desde
 * direcciones IP de servidores (error 403). Funciona correctamente desde
 * localhost durante el desarrollo.
 *
 * Comix API es el proveedor principal activo: tiene proxy de imágenes
 * integrado, bypass de CORS y soporte para múltiples idiomas.
 */
export function registerProviders(): void {
  providerRegistry.register(comixAdapter);
  providerRegistry.register(mangadexAdapter);
}
