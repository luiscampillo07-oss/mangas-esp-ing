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
| **Límites de peticiones** | Rate limits aplicables (consultar documentación); entorno de desarrollo disponible en `https://api.mangadex.dev` |
| **Licencia de datos** | Contenido de la comunidad (scanlations) |
| **Licencia de imágenes** | Contenido subido por grupos de scanlation |
| **Términos de uso** | https://api.mangadex.org/docs/ (Acceptable use policy) |
| **Permisos de reproducción y distribución** | **Debe creditarsse a MangaDex y a los scanlation groups si se ofrecen capítulos para lectura.** CORS no permite hotlinking directo de imágenes desde el navegador (requiere proxy del servidor para el lector). |
| **Estado de integración** | UNDER_REVIEW (pendiente de verificar CORS y política de uso comercial) |
| **Limitaciones conocidas** | 1. CORS restringe hotlinking de imágenes — las imágenes del lector deben servirse a través de un proxy del backend. 2. El contenido proviene de scanlations comunitarias, no siempre de editores oficiales. |
| **Fecha de última comprobación** | 04/11/2026 |

---

## 2. Jikan (Unofficial MyAnimeList API)

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

## 3. AniList

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

## 4. Kitsu

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
| MangaDex | Sí | Sí | Sí (con idioma) | Sí | UNDER_REVIEW |
| Jikan | Sí | Sí | No | No | REJECTED (lectura) |
| AniList | Sí | Sí | No | No | REJECTED (lectura) |
| Kitsu | Sí | Sí | Sí (sin idioma) | No | REJECTED (lectura) |

---

## Decisión de integración

**MangaDex es el único proveedor que cumple con todos los requisitos de lectura** (metadatos, portadas, capítulos con idioma, y páginas de imagen). Los demás proveedores solo proveen metadatos y no pueden usarse como proveedores de lectura de capítulos.

Debido a que MangaDex no permite hotlinking directo de imágenes (CORS restringido), las imágenes del lector deberán servirse a través de un proxy del backend o la integración deberá reconsiderarse si esta restricción no puede salvarse de forma legítima.

Si MangaDex no puede integrarse por la restricción de COS/licencia, no hay entre los proveedores investigados ninguno que permita leer capítulos con imágenes en español de forma legítima, y esa funcionalidad deberá documentarse como no disponible en lugar de simularse.
