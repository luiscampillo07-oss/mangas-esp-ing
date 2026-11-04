# PROVIDERS.md

Documentación de proveedores de datos y contenido para la aplicación de lectura de manga.

Última actualización: 04/11/2026

---

## 1. MangaDex

| Campo | Valor |
|---|---|
| **Nombre** | MangaDex |
| **Página oficial** | https://mangadex.org/ |
| **Documentación** | https://api.mangadex.org/docs/redoc.html |
| **URL base** | https://api.mangadex.org |
| **Tipo de proveedor** | Combined Provider (Metadata + Cover + Chapter + Page) |
| **Funcionalidades disponibles** | Búsqueda de mangas, detalles de manga, portada, lista de capítulos con idioma, imágenes de páginas (vía at-home server) |
| **Idiomas** | `es` (Castilian Spanish), `es-la` (Latin American Spanish), `en`, `ja`, y muchos más (ISO 639-1) |
| **Contenido en español** | Sí, se pueden filtrar capítulos por `translatedLanguage[]=es` |
| **Autenticación** | No requerida para endpoints públicos de lectura |
| **Límites de peticiones** | Rate limits aplicables (consultar documentación) |
| **Licencia de datos** | Contenido de la comunidad (scanlations) |
| **Licencia de imágenes** | Contenido subido por grupos de scanlation |
| **Términos de uso** | https://api.mangadex.org/docs/ (Acceptable use policy) |
| **Permisos de reproducción y distribución** | **Debe creditarsse a MangaDex y a los scanlation groups si se ofrecen capítulos para lectura.** CORS no permite hotlinking directo de imágenes desde el navegador (requiere proxy del servidor). **No se puede usar comercialmente (no se pueden mostrar anuncios).** |
| **Estado de integración** | DISABLED |
| **Limitaciones conocidas** | 1. MangaDex bloquea solicitudes (403 Forbidden) desde direcciones IP de servidores/centros de datos. Funciona desde localhost durante desarrollo. 2. CORS restringe hotlinking de imágenes — las imágenes del lector deben servirse a través de un proxy del backend. 3. El contenido proviene de scanlations comunitarias, no siempre de editores oficiales. 4. No se permite uso comercial. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## 2. Comix API

| Campo | Valor |
|---|---|
| **Nombre** | Comix API |
| **Página oficial** | https://github.com/yurtzy/comix-api |
| **Documentación** | https://github.com/yurtzy/comix-api (README con endpoints) |
| **URL base** | https://comix-api.vercel.app/api/manga |
| **Tipo de proveedor** | Combined Provider (Metadata + Cover + Chapter + Page) |
| **Funcionalidades disponibles** | Catálogo de mangas, búsqueda por título, detalles de manga, portada, lista de capítulos, imágenes de páginas de capítulo |
| **Idiomas** | Soporta múltiples idiomas según el contenido upstream (incluye `es`, `es-la`, `en`, `ja` según MangaFire/Tachiyomi) |
| **Contenido en español** | Soporta filtrado por idioma según el contenido disponible en el upstream |
| **Autenticación** | No requerida |
| **Límites de peticiones** | No especificados públicamente |
| **Licencia de datos** | Contenido del upstream (Comix API es un proxy) |
| **Licencia de imágenes** | Imágenes del upstream, servidas a través de proxy local para bypass de CORS |
| **Términos de uso** | https://github.com/yurtzy/comix-api |
| **Permisos de reproducción y distribución** | Comix API es un middleware no oficial sobre el upstream. No hospeda ni redistribuye contenido. Las imágenes se sirven a través de un proxy local para evitar problemas de CORS. Verificar términos del upstream original. |
| **Estado de integración** | APPROVED |
| **Limitaciones conocidas** | 1. Es un middleware no oficial y no afiliado con el upstream original. 2. Puede tener disponibilidad limitada dependiendo del upstream. 3. El contenido puede estar principalmente en inglés; verificar disponibilidad en español por capítulo. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## 3. Jikan (Unofficial MyAnimeList API)

| Campo | Valor |
|---|---|
| **Nombre** | Jikan |
| **Página oficial** | https://jikan.moe/ |
| **Documentación** | https://docs.api.jikan.moe/ |
| **URL base** | https://api.jikan.moe/v4 |
| **Tipo de proveedor** | Metadata Provider |
| **Funcionalidades disponibles** | Búsqueda de mangas, detalles de manga (título, sinopsis, autor, géneros, estado, conteo de capítulos, portada) |
| **Idiomas** | No filtra capítulos por idioma; datos principalmente en inglés/japonés |
| **Contenido en español** | No aplica (no provee capítulos traducidos ni páginas) |
| **Autenticación** | No requerida |
| **Límites de peticiones** | 3 req/segundo, 60 req/minuto |
| **Licencia de datos** | Datos de MyAnimeList (Jikan es un scraper no oficial) |
| **Licencia de imágenes** | Imágenes de MyAnimeList |
| **Términos de uso** | Solo lectura (GET). No permite acciones de usuario. |
| **Permisos de reproducción y distribución** | No provee capítulos ni páginas de imagen. Solo metadatos. No apto como proveedor de lectura. |
| **Estado de integración** | REJECTED para lectura; APPROVED solo como Metadata Provider auxiliar (sin capítulos ni páginas) |
| **Limitaciones conocidas** | No tiene endpoints de capítulos individualizados, no tiene páginas de imagen, no filtra por idioma de traducción. No puede usarse como proveedor de lectura de manga. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## 4. AniList

| Campo | Valor |
|---|---|
| **Nombre** | AniList |
| **Página oficial** | https://anilist.co/ |
| **Documentación** | https://docs.anilist.co/ |
| **URL base** | https://graphql.anilist.co (GraphQL, POST) |
| **Tipo de proveedor** | Metadata Provider |
| **Funcionalidades disponibles** | Búsqueda de mangas, detalles (títulos romaji/inglés/nativo, sinopsis, géneros, estado, conteo de capítulos, portada) |
| **Idiomas** | No filtra capítulos por idioma |
| **Contenido en español** | No aplica (no provee capítulos traducidos ni páginas) |
| **Autenticación** | No requerida para datos públicos (OAuth2 solo para acciones de usuario) |
| **Límites de peticiones** | ~90 req/minuto |
| **Licencia de datos** | Datos de la comunidad AniList |
| **Licencia de imágenes** | Portadas de la API |
| **Términos de uso** | https://docs.anilist.co/ |
| **Permisos de reproducción y distribución** | No provee capítulos ni páginas de imagen. Solo metadatos y portada. |
| **Estado de integración** | REJECTED para lectura; APPROVED solo como Metadata Provider auxiliar |
| **Limitaciones conocidas** | Solo devuelve conteo de capítulos, no listado individual ni páginas de imagen. No filtra por idioma. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## 5. Kitsu

| Campo | Valor |
|---|---|
| **Nombre** | Kitsu |
| **Página oficial** | https://kitsu.io/ |
| **Documentación** | https://kitsu.docs.apiary.io/ |
| **URL base** | https://kitsu.io/api/edge (JSON:API) |
| **Tipo de proveedor** | Metadata + Chapter Provider |
| **Funcionalidades disponibles** | Búsqueda de mangas, detalles (título, sinopsis, géneros, estado, portada), lista de capítulos (número, título, fecha, sinopsis, conteo de páginas) |
| **Idiomas** | No filtra capítulos por idioma de traducción |
| **Contenido en español** | No aplica (no especifica idioma por capítulo) |
| **Autenticación** | OAuth2 para escrituras; GET públicos sin autenticación |
| **Límites de peticiones** | No especificados públicamente |
| **Licencia de datos** | Datos de la comunidad Kitsu |
| **Licencia de imágenes** | Portadas de la API |
| **Términos de uso** | https://kitsu.docs.apiary.io/ |
| **Permisos de reproducción y distribución** | No provee URLs de imágenes de páginas individuales. Solo metadatos de capítulos. |
| **Estado de integración** | REJECTED para lectura; APPROVED solo como Metadata + Chapter (sin páginas) |
| **Limitaciones conocidas** | No tiene endpoint para obtener imágenes de páginas de un capítulo. No filtra capítulos por idioma. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## Clasificación resumen

| Proveedor | Metadata | Cover | Chapter | Page | Estado |
|---|---|---|---|---|---|
| MangaDex | Sí | Sí | Sí (con idioma) | Sí | DISABLED (bloqueado desde servidores) |
| Comix API | Sí | Sí | Sí | Sí | APPROVED |
| Jikan | Sí | Sí | No | No | REJECTED (lectura) |
| AniList | Sí | Sí | No | No | REJECTED (lectura) |
| Kitsu | Sí | Sí | Sí (sin idioma) | No | REJECTED (lectura) |

---

## Decisión de integración

**Comix API es el proveedor principal activo.** Tiene proxy de imágenes integrado, bypass de CORS, y soporte para múltiples idiomas. Es el único proveedor que cumple con todos los requisitos de lectura desde un servidor.

**MangaDex está marcado como DISABLED** porque bloquea solicitudes (403 Forbidden) desde direcciones IP de servidores/centros de datos. Funciona correctamente desde localhost durante el desarrollo. Se puede reactivar si se resuelve el bloqueo de IP.

Los demás proveedores (Jikan, AnIList, Kitsu) solo proveen metadatos y no pueden usarse como proveedores de lectura de capítulos con imágenes.

---

## Sobre MangaDex y error 403

MangaDex bloquea solicitudes (HTTP 403 Forbidden) desde direcciones IP de servidores y centros de datos. Esto es una restricción del proveedor, no un error de código.

- **Desde localhost (desarrollo):** MangaDex funciona correctamente (localhost está whitelisted para CORS).
- **Desde servidores de producción:** MangaDex devuelve 403 Forbidden.

Si se necesita usar MangaDex en producción, se debe:
1. Usar una dirección IP que no esté bloqueada por MangaDex, o
2. Usar un proxy intermedio autorizado, o
3. Contactar a MangaDex para solicitar acceso.

Mientras tanto, Comix API sirve como proveedor principal funcional.
