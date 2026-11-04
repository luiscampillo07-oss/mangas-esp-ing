import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Obtiene la información de las páginas de un capítulo de MangaDex.
 * Llama al at-home server para obtener baseUrl, hash y lista de archivos.
 *
 * Query params:
 *   quality - 'data' o 'data-saver'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chapterId } = req.query;
  const { quality = 'data' } = req.query;

  if (!chapterId || typeof chapterId !== 'string') {
    return res.status(400).json({ error: 'Missing chapterId' });
  }

  try {
    const response = await fetch(
      `https://api.mangadex.org/at-home/server/${chapterId}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MangasApp/1.0.0 (https://github.com/luiscampillo07-oss/mangas-esp-ing)',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to get chapter server info' });
    }

    const data = await response.json();

    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const pages = data.chapter.data || [];

    // Construir URLs de página a través de nuestro proxy
    const pageUrls = pages.map((fileName: string, index: number) => ({
      id: `page-${chapterId}-${index}`,
      imageUrl: `/api/manga-dex/image?baseUrl=${encodeURIComponent(baseUrl)}&hash=${encodeURIComponent(hash)}&file=${encodeURIComponent(fileName)}&quality=${quality}`,
      order: index + 1,
    }));

    return res.status(200).json({
      chapterId,
      baseUrl,
      hash,
      quality,
      pages: pageUrls,
      totalPages: pages.length,
    });
  } catch (error) {
    console.error('[MangaDex Chapter Pages] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
