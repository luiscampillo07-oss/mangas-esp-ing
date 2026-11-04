import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MangaGrid from '@/components/MangaGrid';
import { useMangaCatalog } from '@/hooks/useMangaCatalog';
import { useContinueReading } from '@/hooks/useContinueReading';
import { Manga } from '@/models';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const { mangas, loading, error, hasMore, loadMore, refresh } = useMangaCatalog(1, 20);
  const { entries: continueReadingEntries, navigateToChapter } = useContinueReading();

  const mangasToShow = searchQuery.trim() ? searchResults : mangas;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // El hook useMangaCatalog ya busca en el catálogo, pero para búsqueda
      // activa necesitamos usar providerService directamente
      // Por ahora, usamos los resultados del catálogo filtrados localmente
      // hasta que se implemente searchManga completo en el proveedor
      setSearchResults(mangas.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase())
      ));
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Head>
        <title>Mangas - Lectura de manga en español</title>
        <meta name="description" content="Descubre y lee mangas con capítulos en español de proveedores verificados." />
      </Head>

      <header className="border-b border-dark-700 bg-dark-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-accent-purple">Mangas</span>
              <span className="text-xs text-dark-400 uppercase tracking-wider">es</span>
            </Link>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/public-apis/public-apis#anime"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dark-400 hover:text-dark-200 transition-colors"
              >
                Proveedores públicos
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Continuar leyendo */}
        {continueReadingEntries.length > 0 && (
          <section className="mb-8">
            <h2 className="section-title">
              <span className="text-accent-purple">▶</span> Continuar leyendo
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {continueReadingEntries.map((entry) => (
                <div
                  key={entry.mangaId}
                  className="flex-shrink-0 w-32 group cursor-pointer"
                  onClick={() => navigateToChapter(entry)}
                >
                  {entry.cover ? (
                    <img
                      src={entry.cover}
                      alt={entry.title}
                      className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-48 bg-dark-800 rounded-lg flex items-center justify-center text-dark-500 text-sm">
                      Sin portada
                    </div>
                  )}
                  <h3 className="mt-2 font-medium text-dark-100 line-clamp-1">{entry.title}</h3>
                  <p className="text-xs text-dark-500">
                    Cap. {entry.chapterNumber || '?'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Buscador */}
        <section className="mb-8">
          <h2 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar mangas
          </h2>
          <SearchBar
            placeholder="Buscar por título..."
            onSearch={handleSearch}
          />
        </section>

        {/* Catálogo */}
        <section>
          <h2 className="section-title mb-4">
            {searchQuery ? 'Resultados de búsqueda' : 'Catálogo de mangas'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <MangaGrid mangas={mangasToShow} />

          {loading && <p className="mt-4 text-dark-500">Cargando más...</p>}

          {!loading && !searchQuery && mangas.length > 0 && hasMore && (
            <button
              onClick={loadMore}
              className="mt-6 px-6 py-2 bg-dark-800 hover:bg-dark-700 text-dark-100 rounded border border-dark-600 transition-colors"
            >
              Cargar más
            </button>
          )}

          {!loading && !searchQuery && mangas.length === 0 && (
            <p className="mt-8 text-center text-dark-500">
              No se encontraron mangas en el catálogo.
            </p>
          )}

          {searchQuery && searchResults.length === 0 && (
            <p className="mt-8 text-center text-dark-500">
              No se encontraron resultados para "{searchQuery}".
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
