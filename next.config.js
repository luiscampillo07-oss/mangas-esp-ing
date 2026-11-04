/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir llamadas al proxy de imágenes de MangaDex desde el frontend
  async rewrites() {
    return [
      {
        source: '/api/manga-dex/:path*',
        destination: 'https://api.mangadex.org/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
