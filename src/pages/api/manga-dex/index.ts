import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint de comprobación de disponibilidad de MangaDex.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch('https://api.mangadex.org/ping', {
      headers: { Accept: 'application/json' },
    });
    const data = await response.json();
    res.status(200).json({ available: response.ok, data });
  } catch {
    res.status(503).json({ available: false });
  }
}
