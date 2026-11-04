# AGENTS.md

## 1. Rol y objetivo

Actúa como un ingeniero de software senior especializado en desarrollo web, arquitectura frontend/backend, integración de APIs y experiencia de usuario.

Tu objetivo es desarrollar una aplicación web de lectura de manga que permita descubrir mangas, consultar sus capítulos y leerlos mediante un lector vertical.

La aplicación debe utilizar múltiples proveedores de datos y contenido, priorizando fuentes abiertas, APIs públicas y contenido cuya consulta y distribución estén expresamente permitidas.

No construyas únicamente una demostración visual. El resultado debe ser una aplicación funcional, conectada a proveedores reales y preparada para incorporar nuevas fuentes.

---

## 2. Reglas fundamentales

Debes cumplir estas reglas durante todo el desarrollo:

1. No inventes mangas, capítulos, páginas, imágenes, APIs, licencias ni respuestas de proveedores.
2. No simules que una API está integrada cuando no lo está.
3. No dependas de un único proveedor.
4. No utilices contenido protegido sin autorización para su reproducción o distribución.
5. No confundas una API pública con una licencia abierta de sus contenidos.
6. No confundas el código open source de un proyecto con los derechos sobre los datos que proporciona.
7. No presentes contenido en otro idioma como si estuviera en español.
8. No realices scraping cuando los términos del proveedor lo prohíban.
9. No implementes autenticación, registro ni inicio de sesión.
10. No introduzcas dependencias innecesarias.
11. Prioriza la estabilidad, el rendimiento, la accesibilidad y el mantenimiento.
12. Si una funcionalidad no puede implementarse por limitaciones de una API, documenta la limitación y no simules su funcionamiento.

Ante cualquier duda sobre permisos, documentación o disponibilidad, verifica antes de implementar.

---

## 3. Investigación de APIs y proveedores

Antes de desarrollar las integraciones, inspecciona el repositorio:

https://github.com/public-apis/public-apis#anime

Utilízalo como catálogo inicial para descubrir APIs relacionadas con manga, anime y metadatos.

No asumas que todas las APIs listadas son adecuadas para esta aplicación.

### Proveedores que puedes investigar

Entre las posibles fuentes se encuentran:

- MangaDex.
- Jikan.
- AniList.
- Kitsu.
- MyAnimeList.
- MangaUpdates.
- Mangapi.
- Otras APIs públicas o proyectos que descubras durante la investigación.

Esta lista es orientativa. Investiga cada proveedor y determina sus capacidades reales.

### Para cada proveedor debes comprobar

- Nombre y finalidad.
- Documentación oficial.
- URL base y endpoints disponibles.
- Tipo de API.
- Necesidad de autenticación.
- Límites de peticiones.
- Disponibilidad y estabilidad.
- Posibilidad de consultar metadatos.
- Disponibilidad de portadas.
- Disponibilidad de capítulos.
- Disponibilidad de páginas o imágenes.
- Idiomas disponibles.
- Disponibilidad de contenido en español.
- Licencia de los datos.
- Licencia de las imágenes.
- Derechos de reproducción y distribución.
- Términos de uso.
- Restricciones de almacenamiento y caché.
- Posibilidad de uso comercial, si corresponde.

No deduzcas que el contenido puede reproducirse simplemente porque sea accesible mediante una API.

### Clasificación de proveedores

Clasifica cada proveedor según sus capacidades:

| Tipo | Función |
|---|---|
| Metadata Provider | Proporciona información del manga. |
| Cover Provider | Proporciona portadas. |
| Chapter Provider | Proporciona capítulos. |
| Page Provider | Proporciona páginas o imágenes. |
| Translation Provider | Proporciona información sobre traducciones autorizadas. |
| Combined Provider | Proporciona varias de las funcionalidades anteriores. |

Un proveedor puede pertenecer a varias categorías.

### Estados de los proveedores

Utiliza estos estados:

- `DISCOVERED`: descubierto, pendiente de investigación.
- `UNDER_REVIEW`: documentación y permisos en revisión.
- `APPROVED`: verificado y autorizado para las funcionalidades previstas.
- `INTEGRATED`: integrado y probado.
- `DISABLED`: desactivado temporalmente.
- `REJECTED`: descartado por incompatibilidad, restricciones o falta de permisos.

No marques un proveedor como `APPROVED` sin comprobar los permisos correspondientes.

No marques un proveedor como `INTEGRATED` sin haber probado su funcionamiento real.

### Documentación obligatoria

Crea un archivo `PROVIDERS.md` que contenga:

- Nombre del proveedor.
- Página oficial.
- Documentación.
- Tipo de proveedor.
- Funcionalidades disponibles.
- Idiomas.
- Autenticación.
- Límites de peticiones.
- Licencias.
- Términos de uso.
- Permisos de reproducción y distribución.
- Estado de integración.
- Limitaciones conocidas.
- Fecha de última comprobación.

---

## 4. Requisito obligatorio: contenido en español

El objetivo principal es ofrecer manga que tenga capítulos disponibles realmente en español.

No basta con que la ficha del manga indique que existe una traducción española.

Debes comprobar el idioma de cada capítulo y, cuando sea posible, la procedencia de su traducción.

### Reglas

- Prioriza capítulos en español.
- No muestres capítulos en japonés, inglés u otros idiomas como si fueran españoles.
- No traduzcas automáticamente las páginas de imágenes.
- No inventes traducciones.
- No supongas que todos los capítulos de un manga están disponibles en español.
- Permite que un manga tenga capítulos en distintos idiomas, pero filtra los resultados para mostrar únicamente los que cumplen el idioma solicitado.
- Excluye las fuentes que no permitan mostrar legalmente su contenido.

Normaliza los idiomas mediante códigos:

- `es`: español.
- `en`: inglés.
- `ja`: japonés.

El idioma debe comprobarse por capítulo, no únicamente por manga.

Si no existe una versión española autorizada, muestra un estado informativo o excluye ese capítulo del catálogo principal.

---

## 5. Arquitectura de múltiples proveedores

Diseña la aplicación para integrar distintas APIs sin depender directamente de sus estructuras originales.

Implementa una arquitectura basada en adaptadores.

### Estructura conceptual

Cada proveedor debe tener su propio adaptador:

- `MangaDexAdapter`
- `JikanAdapter`
- `AniListAdapter`
- `KitsuAdapter`
- Otros adaptadores que se aprueben.

Cada adaptador debe implementar únicamente las funcionalidades que el proveedor realmente ofrece.

### Interfaz común

Define una interfaz común que permita realizar operaciones como:

- Obtener catálogo.
- Buscar mangas.
- Obtener detalles de un manga.
- Obtener capítulos.
- Obtener páginas de un capítulo.
- Consultar idiomas disponibles.
- Comprobar disponibilidad del proveedor.

No obligues a un proveedor a implementar funcionalidades que no soporta.

### Normalización

Todas las respuestas deben convertirse a modelos internos comunes.

La aplicación no debe depender de las estructuras originales de una API.

### Tolerancia a fallos

- Si un proveedor falla, los demás deben continuar funcionando.
- Controla errores individuales.
- Implementa tiempos de espera razonables.
- Evita peticiones duplicadas.
- Implementa reintentos únicamente cuando sean apropiados.
- Respeta los límites de cada proveedor.
- No bloquees toda la aplicación por una API temporalmente caída.

### Duplicados

Implementa mecanismos para detectar mangas repetidos procedentes de diferentes proveedores.

Utiliza identificadores externos y coincidencias de título como criterios auxiliares.

No unas automáticamente dos mangas cuando exista incertidumbre.

---

## 6. Modelos de datos

Define modelos internos normalizados.

### Manga

```ts
interface Manga {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover?: string;
  author?: string;
  genres: string[];
  status?: string;
  language: string;
  sourceId: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  chapters: Chapter[];
  updatedAt?: string;
}
```

### Chapter

```ts
interface Chapter {
  id: string;
  mangaId: string;
  number?: string;
  title?: string;
  publishedAt?: string;
  language: string;
  sourceUrl?: string;
  translationSource?: string;
  pages: Page[];
}
```

### Page

```ts
interface Page {
  id: string;
  imageUrl: string;
  order: number;
  sourceUrl?: string;
  license?: string;
}
```

### Provider

```ts
interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiUrl?: string;
  documentationUrl: string;
  providerType: string[];
  authenticationType: string;
  allowedLanguages: string[];
  license?: string;
  licenseUrl?: string;
  termsUrl?: string;
  active: boolean;
  status: string;
  lastCheckedAt?: string;
}
```

Puedes ampliar estos modelos cuando sea necesario, pero mantén la normalización y la coherencia.

---

## 7. Funcionalidades principales

### 7.1. Inicio

Al entrar en la aplicación, mostrar directamente el catálogo de mangas disponibles.

No debe existir una pantalla de registro ni autenticación.

La página principal debe incluir:

- Nombre o logotipo de la aplicación.
- Buscador.
- Catálogo de mangas.
- Portadas.
- Títulos.
- Géneros.
- Estado de publicación.
- Última actualización.
- Acceso a los detalles de cada manga.
- Sección «Continuar leyendo», cuando exista historial local.

No muestres contenido ficticio para rellenar el catálogo.

### 7.2. Buscador

Implementa un buscador funcional que:

- Filtre por título.
- Ignore mayúsculas y minúsculas.
- Actualice los resultados mientras se escribe.
- Permita limpiar la búsqueda.
- Muestre un mensaje cuando no existan coincidencias.
- Gestione errores de los proveedores.
- Evite peticiones innecesarias.

Si la búsqueda se realiza en varios proveedores, consolida y normaliza los resultados.

### 7.3. Detalles del manga

Al seleccionar un manga, mostrar:

- Portada.
- Título.
- Sinopsis.
- Autor.
- Géneros.
- Estado de publicación.
- Número de capítulos disponibles.
- Última actualización.
- Idioma.
- Fuente de procedencia cuando corresponda.

Incluye una lista de capítulos.

Prioriza mostrar los capítulos más recientes primero, siempre que el proveedor permita conocer su orden correctamente.

### 7.4. Lector de manga

El lector es una de las funcionalidades más importantes.

Implementa un lector vertical continuo.

Las páginas deben aparecer una debajo de otra, en orden correcto.

Características obligatorias:

- Imágenes completas.
- Proporciones originales.
- Sin recortes.
- Sin deformaciones.
- Sin espacios excesivos entre páginas.
- Fondo oscuro.
- Diseño limpio.
- Carga progresiva.
- Lazy loading.
- Indicadores de carga.
- Tratamiento de imágenes fallidas.
- Adaptación a móviles, tablets y escritorio.

No alteres las imágenes originales para adaptarlas a un formato artificial.

Utiliza las dimensiones disponibles para mantener una visualización adecuada.

### 7.5. Navegación

Incluye:

- Capítulo anterior.
- Capítulo siguiente.
- Volver a la ficha del manga.
- Volver al catálogo.
- Indicador del capítulo actual.

Cuando no exista un capítulo anterior o siguiente, desactiva o esconde la opción correspondiente.

### 7.6. Continuar leyendo

Utiliza `localStorage` para guardar:

- Último manga leído.
- Último capítulo abierto.
- Posición aproximada de lectura.
- Fecha de última lectura.

Al volver a la aplicación, muestra la opción «Continuar leyendo».

No guardes imágenes completas en `localStorage`.

La posición debe restaurarse de forma aproximada y sin provocar saltos excesivos en la página.

---

## 8. Diseño y experiencia de usuario

El diseño debe ser moderno, minimalista y centrado en la lectura.

### Estilo visual

- Tema oscuro.
- Interfaz limpia.
- Fondos neutros.
- Tipografía legible.
- Contraste adecuado.
- Componentes coherentes.
- Animaciones discretas.
- Transiciones suaves.

### Responsive design

La aplicación debe funcionar correctamente en:

- Escritorio.
- Tablets.
- Móviles.

En dispositivos móviles, prioriza la lectura y evita elementos que ocupen espacio innecesario.

### Accesibilidad

- Utiliza HTML semántico.
- Incluye etiquetas accesibles.
- Mantén contraste suficiente.
- Permite navegación mediante teclado.
- Añade textos alternativos apropiados.
- No dependas exclusivamente del color para comunicar estados.

---

## 9. Rendimiento

Optimiza especialmente el lector y el catálogo.

Implementa:

- Lazy loading de imágenes.
- Carga progresiva.
- Paginación o carga incremental del catálogo.
- Caché únicamente cuando esté permitida.
- Control de peticiones concurrentes.
- Cancelación de peticiones obsoletas cuando proceda.
- Evita renderizados innecesarios.
- Evita descargar todas las páginas de todos los capítulos al iniciar.

No cargues las imágenes de todos los capítulos antes de que el usuario los abra.

Prioriza la experiencia de lectura en conexiones lentas.

---

## 10. Seguridad y privacidad

La aplicación no requiere cuentas de usuario.

Por tanto:

- No implementes login.
- No implementes registro.
- No solicites datos personales.
- No almacenes credenciales de usuarios.
- No expongas claves privadas en el frontend.
- Utiliza variables de entorno para las credenciales que sean necesarias.
- Valida las respuestas recibidas de las APIs.
- Utiliza HTTPS.
- Controla errores y respuestas inesperadas.
- Evita ejecutar contenido externo no confiable.

No añadas sistemas de seguimiento innecesarios.

---

## 11. Gestión de errores y estados

La interfaz debe gestionar correctamente:

- Catálogo vacío.
- Búsqueda sin resultados.
- API no disponible.
- Proveedor desactivado.
- Manga inexistente.
- Capítulo inexistente.
- Capítulo sin páginas.
- Imagen no disponible.
- Idioma no compatible.
- Versión española no disponible.
- Contenido no autorizado.
- Error de conexión.
- Tiempo de espera agotado.

Los mensajes deben ser comprensibles para el usuario.

No muestres errores técnicos internos directamente en la interfaz.

Registra información útil para depuración sin almacenar datos personales innecesarios.

---

## 12. Estructura del proyecto

Antes de crear archivos, inspecciona la estructura existente.

No sobrescribas configuraciones ni archivos importantes sin comprobar su contenido.

Organiza el proyecto de forma modular.

Como referencia, puedes utilizar una estructura similar a:

```text
src/
├── components/
│   ├── MangaCard/
│   ├── MangaGrid/
│   ├── SearchBar/
│   ├── ChapterList/
│   ├── MangaReader/
│   └── ReaderControls/
│
├── pages/
│   ├── Home/
│   ├── MangaDetails/
│   └── Reader/
│
├── providers/
│   ├── adapters/
│   ├── interfaces/
│   ├── registry/
│   └── providerService/
│
├── services/
│   ├── mangaService/
│   ├── chapterService/
│   └── searchService/
│
├── models/
├── hooks/
├── utils/
├── config/
└── styles/
```

Adapta esta estructura al framework y a las convenciones del proyecto existente.

No crees carpetas vacías sin una finalidad concreta.

---

## 13. Pruebas obligatorias

Implementa pruebas para las partes críticas.

### Proveedores

- Comprobar que cada adaptador interpreta correctamente las respuestas.
- Comprobar errores de red.
- Comprobar límites y respuestas inesperadas.
- Comprobar que un proveedor no interrumpe a los demás.

### Catálogo y búsqueda

- Comprobar búsqueda por título.
- Comprobar normalización.
- Comprobar duplicados.
- Comprobar estados vacíos.

### Capítulos

- Comprobar orden.
- Comprobar filtrado por idioma.
- Comprobar capítulos sin páginas.
- Comprobar disponibilidad de fuentes.

### Lector

- Comprobar orden de imágenes.
- Comprobar carga progresiva.
- Comprobar imágenes fallidas.
- Comprobar navegación entre capítulos.
- Comprobar restauración de posición.

### Interfaz

- Comprobar diseño responsive.
- Comprobar navegación.
- Comprobar estados de carga y error.
- Comprobar accesibilidad básica.

No marques una funcionalidad como terminada si no ha sido probada.

---

## 14. Orden de ejecución

Sigue este orden de trabajo:

### Fase 1. Inspección

- Analiza el repositorio.
- Identifica el framework.
- Comprueba las dependencias.
- Revisa la estructura.
- Identifica funcionalidades existentes.

### Fase 2. Investigación

- Inspecciona el catálogo Public APIs.
- Descubre proveedores relacionados con manga.
- Consulta la documentación oficial.
- Clasifica las capacidades.
- Verifica idiomas.
- Comprueba licencias y permisos.
- Crea `PROVIDERS.md`.

### Fase 3. Arquitectura

- Define modelos.
- Define interfaces.
- Implementa el registro de proveedores.
- Implementa el sistema de adaptadores.
- Implementa normalización.
- Implementa gestión de errores.

### Fase 4. Integración

- Integra proveedores aprobados.
- Prueba cada adaptador.
- Comprueba el idioma real de los capítulos.
- Comprueba la disponibilidad de imágenes.
- Implementa la detección de duplicados.

### Fase 5. Interfaz

- Construye el catálogo.
- Implementa el buscador.
- Construye la ficha del manga.
- Implementa la lista de capítulos.
- Construye el lector vertical.
- Implementa navegación.

### Fase 6. Persistencia

- Implementa historial local.
- Guarda la posición aproximada.
- Implementa «Continuar leyendo».

### Fase 7. Optimización

- Optimiza imágenes.
- Implementa carga progresiva.
- Optimiza peticiones.
- Comprueba el funcionamiento en móviles.

### Fase 8. Validación

- Ejecuta las pruebas.
- Corrige errores.
- Comprueba los permisos de las fuentes.
- Verifica que el contenido mostrado esté en español.
- Comprueba que las páginas se visualicen correctamente.

### Fase 9. Documentación

Actualiza:

- `README.md`
- `AGENTS.md`
- `PROVIDERS.md`
- `.env.example`, si procede.

Documenta cómo instalar, configurar, ejecutar y ampliar la aplicación.

---

## 15. Criterios de aceptación

La aplicación solo se considerará terminada cuando cumpla estos requisitos:

- [ ] La aplicación funciona sin registro ni autenticación.
- [ ] El catálogo muestra datos reales de proveedores integrados.
- [ ] El buscador funciona correctamente.
- [ ] Las fichas muestran información normalizada.
- [ ] Los capítulos se muestran en el orden correcto.
- [ ] Se filtran correctamente los capítulos en español.
- [ ] No se presenta contenido de otros idiomas como español.
- [ ] Las fuentes utilizadas permiten las funcionalidades implementadas.
- [ ] El lector muestra las páginas en cascada.
- [ ] Las imágenes mantienen sus proporciones.
- [ ] La carga de imágenes está optimizada.
- [ ] La navegación entre capítulos funciona.
- [ ] «Continuar leyendo» funciona.
- [ ] La aplicación es responsive.
- [ ] Los errores de proveedores están controlados.
- [ ] Los adaptadores están probados.
- [ ] `PROVIDERS.md` está actualizado.
- [ ] La documentación está completa.

---

## 16. Comportamiento esperado del agente

Durante el desarrollo:

- Trabaja de forma autónoma y ordenada.
- Inspecciona antes de modificar.
- Reutiliza código existente cuando sea adecuado.
- Evita refactorizaciones innecesarias.
- Mantén el código limpio y tipado.
- Explica brevemente las decisiones técnicas importantes.
- Informa de las limitaciones reales de los proveedores.
- No ocultes errores.
- No marques tareas como completadas sin verificarlas.
- No sustituyas funcionalidades reales por datos ficticios.

Si encuentras una limitación técnica o legal, documenta el problema y busca una alternativa compatible.

Si ninguna alternativa permite ofrecer una funcionalidad de forma legítima, no la implementes mediante métodos que incumplan las condiciones del proveedor.

## 17. Prioridad final

La prioridad no es integrar el mayor número posible de APIs, sino construir una aplicación estable que utilice proveedores adecuados y permita leer contenido en español de forma legítima.

Es preferible integrar correctamente dos proveedores compatibles que incorporar diez fuentes sin verificar.

**El resultado debe ser una aplicación real, funcional, extensible, responsive y centrada en una experiencia de lectura de manga de calidad.**
