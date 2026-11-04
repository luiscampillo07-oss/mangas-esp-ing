import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proxy genérico para la API de MangaDex.
 *
 * Todas las peticiones a MangaDex se reenvían a través de este endpoint
 * del servidor para evitar:
 * 1. Bloqueos 403 de MangaDex desde el navegador/cliente
 * 2. Problemas de CORS en imágenes y recursos
 *
 * MangaDex permite el uso de su API pública desde servidores.
 * Este proxy no modifica los datos, solo reenvía la petición y la respuesta.
 *
 * Query params (opcionales):
 *   - Cualquier query param se reenvía tal cual a MangaDex
 *
 * Path: /api/manga-dex/proxy/manga, /api/manga-dex/proxy/chapter/:id, etc.
 */
const MANGADEX_BASE_URL = 'https://api.mangadex.org';

const MANGADEX_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MangasApp/1.0.0',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  Referer: 'https://mangadex.org/',
  Origin: 'https://mangadex.org',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const mangaDexPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${MANGADEX_BASE_URL}/${mangaDexPath}`;

  // Construir query string
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  try {
    const response = await fetch(finalUrl, {
      method: req.method || 'GET',
      headers: {
        ...MANGADEX_HEADERS,
        // No forward headers sensibles del cliente
        ...(req.headers['content-type']
          ? { 'Content-Type': req.headers['content-type'] as string }
          : {}),
      },
      // No forward body en GET requests
      ...(req.method !== 'GET' && req.method !== 'HEAD'
        ? { body: req.body }
        : {}),
    });

    const contentType = response.headers.get('content-type') || 'application/json';

    // Si es JSON, devolver como JSON
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Si no es JSON (imagen u otro), devolver como buffer
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    console.error('[MangaDex Proxy] Error:', error);
    return res.status(502).json({
      error: 'Error al conectar con MangaDex',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
