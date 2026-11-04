import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proxy de imágenes de MangaDex.
 * MangaDex no permite hotlinking directo de imágenes desde el navegador (CORS restringido).
 * Este endpoint sirve las imágenes a través de nuestro servidor para evitar problemas de CORS.
 *
 * Query params:
 *   baseUrl - URL base del at-home server (obtenida de /at-home/server/:chapterId)
 *   hash    - Hash del capítulo
 *   file    - Nombre del archivo de página
 *   quality - 'data' o 'data-saver'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { baseUrl, hash, file, quality = 'data' } = req.query;

  if (!baseUrl || !hash || !file) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const imageUrl = `${baseUrl}/${quality}/${hash}/${file}`;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // No enviar headers de autenticación a los servidores de imágenes de MangaDex
        Referer: 'https://mangadex.org/',
        'User-Agent': 'MangasApp/1.0.0 (https://github.com/luiscampillo07-oss/mangas-esp-ing)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('[MangaDex Image Proxy] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
