# Mangas - Aplicación de lectura de manga en español

Aplicación web para descubrir, buscar y leer mangas con capítulos disponibles en español.
Conectada a proveedores reales mediante arquitectura de adaptadores, tolerante a fallos y sin autenticación.

## Características

- **Catálogo de mangas** con datos reales de proveedores integrados
- **Buscador** por título con actualización en tiempo real
- **Fichas de manga** con sinopsis, autor, géneros, estado y capítulos
- **Lector vertical continuo** con carga progresiva y lazy loading
- **Filtro por idioma** - prioriza capítulos en español (`es`)
- **Continuar leyendo** - historial local en `localStorage`
- **Diseño responsive** - móvil, tablet y escritorio
- **Tema oscuro** optimizado para lectura
- **Sin registro ni autenticación**

## Arquitectura

La aplicación utiliza una **arquitectura basada en adaptadores** para integrar múltiples proveedores sin depender de sus estructuras originales:

```
src/
├── models/           - Modelos internos normalizados (Manga, Chapter, Page, Provider)
├── providers/        - Sistema de adaptadores de proveedores
│   ├── adapters/     - Adaptadores específicos (MangaDex, etc.)
│   ├── interfaces/   - Interfaz común (MangaProvider)
│   ├── registry/     - Registro de proveedores activos
│   └── providerService - Orquestación tolerante a fallos
├── services/         - Servicios de dominio
├── components/       - Componentes de UI (MangaCard, MangaGrid, SearchBar, etc.)
├── pages/            - Páginas (Home, MangaDetails, Reader, API routes)
├── hooks/            - Hooks de React (useMangaCatalog, useSearch, useContinueReading)
└── utils/            - Utilidades (duplicados, idioma)
```

### Proveedores integrados

| Proveedor | Tipo | Capacidades | Estado |
|-----------|------|-------------|--------|
| MangaDex | Combined | Metadata, Cover, Chapter, Page | INTEGRATED |

Otros proveedores investigados (Jikan, AniList, Kitsu) solo proveen metadatos y no son aptos para lectura de capítulos con imágenes.

## Requisitos previos

- Node.js 18+
- npm o yarn

## Instalación

```bash
# Clonar el repositorio
cd /home/luis/Mangas

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar pruebas
npm run test
```

## Estructura de rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Catálogo de mangas con buscador y "Continuar leyendo" |
| `/manga/[id]` | Ficha de manga con lista de capítulos en español |
| `/reader/[mangaId]/[chapterId]` | Lector vertical de capítulo |
| `/api/manga-dex` | Comprobación de disponibilidad de MangaDex |
| `/api/manga-dex/chapter/[chapterId]/pages` | Información de páginas de un capítulo |
| `/api/manga-dex/image` | Proxy de imágenes de MangaDex (resuelve CORS) |

## Proxy de imágenes

MangaDex no permite hotlinking directo de imágenes desde el navegador (política CORS restringida).
Las imágenes se sirven a través de un proxy del backend (`/api/manga-dex/image`) para evitar este problema.

## Pruebas

```bash
npm run test
```

Las pruebas cubren:
- Adaptadores (MangaDex): respuestas, errores de red, capítulos sin páginas, construcción de URLs
- Servicio de proveedores: tolerancia a fallos, búsqueda, deduplicación
- Utilidades: detección de duplicados, normalización de idiomas

## Proveedores investigados (PROVIDERS.md)

Consulta `PROVIDERS.md` para la investigación detallada de todos los proveedores evaluados:
- MangaDex: Combined Provider (metadatos, portadas, capítulos, páginas)
- Jikan: Metadata Provider (solo metadatos, sin capítulos ni páginas)
- AniList: Metadata Provider (GraphQL, solo metadatos y portada)
- Kitsu: Metadata + Chapter Provider (sin páginas de imagen)

## Licencia y uso legal

La aplicación prioriza fuentes abiertas y contenido cuya consulta y distribución estén expresamente permitidas.
- No se implementa autenticación ni registro
- No se almacenan datos personales
- No se expone contenido protegido sin autorización
- Se respeta la política de uso de cada proveedor (crédito a MangaDex y scanlation groups)

## Desarrollo

El proyecto utiliza:
- Next.js 14 (Pages Router)
- TypeScript
- Tailwind CSS
- Vitest para pruebas

## Criterios de aceptación

Consulta `AGENTS.md` sección 15 para la lista completa de criterios de aceptación.
