import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proxy para obtener páginas de capítulo de Comix API.
 *
 * Llama a GET /api/manga/read?chapterId=<id>&sfw=true en Comix API
 * y devuelve las URLs de imagen de las páginas.
 *
 * El proveedor Comix API requiere que las imágenes se sirvan a través
 * de su propio proxy /api/image para evitar problemas de CORS.
 */
const COMIX_BASE_URL = 'https://comix-api.vercel.app/api/manga';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chapterId } = req.query;

  if (!chapterId || typeof chapterId !== 'string') {
    return res.status(400).json({ error: 'Missing chapterId' });
  }

  // El chapterId puede venir con prefijo 'comix-', extraer el ID real si es necesario
  let realChapterId = chapterId;
  if (realChapterId.startsWith('comix-')) {
    realChapterId = realChapterId.replace(/^comix-/, '');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `${COMIX_BASE_URL}/read?chapterId=${encodeURIComponent(realChapterId)}&sfw=true`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MangasApp/1.0.0',
          },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to get chapter pages from Comix API',
          status: response.status,
        });
      }

      const data = await response.json();

      const images: any[] = data.images || [];

      // Construir URLs de página mediante el proxy de imágenes de Comix API
      const pageUrls = images.map((img: any, index: number) => {
        let imageUrl = '';
        if (img.url) {
          if (img.url.startsWith('http')) {
            imageUrl = img.url;
          } else if (img.url.startsWith('/api/image')) {
            imageUrl = `${COMIX_BASE_URL.replace('/api/manga', '')}${img.url}`;
          } else if (img.url.startsWith('/')) {
            imageUrl = `${COMIX_BASE_URL.replace('/api/manga', '')}/api/image?url=${encodeURIComponent(
              COMIX_BASE_URL.replace('/api/manga', '') + img.url
            )}`;
          } else {
            imageUrl = `${COMIX_BASE_URL.replace('/api/manga', '')}/api/image?url=${encodeURIComponent(
              COMIX_BASE_URL.replace('/api/manga', '') + '/' + img.url
            )}`;
          }
        }

        return {
          id: `comix-page-${chapterId}-${index}`,
          imageUrl,
          order: index + 1,
          sourceUrl: undefined,
          license: undefined,
        };
      });

      return res.status(200).json({
        chapterId,
        pages: pageUrls,
        totalPages: pageUrls.length,
        source: 'comix',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[Comix Chapter Pages] Error:', error);
    return res.status(502).json({
      error: 'Error al conectar con Comix API',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
