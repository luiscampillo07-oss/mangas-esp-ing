import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Manga, Chapter } from '@/models';
import { providerService } from '@/providers/providerService';
import ChapterList from '@/components/ChapterList';
import { useLanguageFilter } from '@/hooks/useLanguageFilter';

export default function MangaDetails() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, setLanguageFilter, isSpanish, isEnglish, isAll } = useLanguageFilter();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const mangaData = await providerService.getMangaDetails(id);
        if (!cancelled && mangaData) {
          setManga(mangaData);
        }
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar la información del manga.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChapterSelect = (chapter: Chapter) => {
    router.push(`/reader/${manga?.id}/${chapter.id}`);
  };

  // Filtrar capítulos por idioma seleccionado
  const chapters = manga?.chapters || [];
  const filteredChapters = chapters.filter((c) => {
    if (isAll) return true;
    if (isSpanish) return c.language === 'es';
    if (isEnglish) return c.language === 'en';
    return true;
  });

  const spanishCount = chapters.filter((c) => c.language === 'es').length;
  const englishCount = chapters.filter((c) => c.language === 'en').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-900">
        <p className="text-dark-400">Cargando manga...</p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-900 text-dark-400">
        <p>{error || 'Manga no encontrado.'}</p>
        <Link href="/" className="mt-4 text-accent-purple hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Head>
        <title>{manga.title} - Mangas</title>
      </Head>

      <nav className="border-b border-dark-700 bg-dark-900/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12">
          <Link href="/" className="text-dark-400 hover:text-dark-200">
            ← Volver al catálogo
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portada y título */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="lg:w-1/3">
            {manga.cover ? (
              <img
                src={manga.cover}
                alt={`Portada de ${manga.title}`}
                className="w-full rounded-lg shadow-xl bg-dark-800"
                loading="lazy"
                onError={(e) => {
                  // Si la imagen falla, mostrar placeholder
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMzAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzIzMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM2ZW0iPlNpbiBwb3J0YWRhPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            ) : (
              <div className="w-full h-96 bg-dark-800 rounded-lg flex items-center justify-center text-dark-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-dark-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Sin portada disponible</p>
              </div>
            )}
          </div>

          <div className="lg:w-2/3 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold mb-2">{manga.title}</h1>
              <div className="flex gap-1">
                {spanishCount > 0 && (
                  <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                    ES ({spanishCount})
                  </span>
                )}
                {englishCount > 0 && (
                  <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                    EN ({englishCount})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genre) => (
                <span key={genre} className="text-sm bg-dark-800 text-dark-300 px-3 py-1 rounded border border-dark-600">
                  {genre}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mb-4 text-sm text-dark-400">
              <span>{manga.status || 'Desconocido'}</span>
              <span>{manga.chapters?.length || 0} capítulos</span>
              <span>{manga.updatedAt ? new Date(manga.updatedAt).toLocaleDateString('es-ES') : ''}</span>
            </div>
            {manga.author && (
              <p className="text-dark-300 mb-4">
                <span className="font-medium text-dark-100">Autor:</span> {manga.author}
              </p>
            )}
            {manga.description && (
              <div className="mb-4">
                <span className="font-medium text-dark-100">Sinopsis:</span>
                <p className="mt-1 text-dark-300 line-clamp-3">{manga.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Selector de idioma y lista de capítulos */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-dark-100">
                Capítulos ({filteredChapters.length})
              </h2>
              <div className="flex items-center gap-2 bg-dark-800 px-3 py-1.5 rounded border border-dark-600">
                <span className="text-xs text-dark-400 uppercase">Filtrar:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguageFilter(e.target.value as any)}
                  className="bg-dark-900 text-dark-100 text-xs border-none focus:ring-0 px-2 py-0.5 rounded"
                >
                  <option value="all">Todos (ES + EN)</option>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
            </div>
            {filteredChapters.length < chapters.length && (
              <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-1 rounded">
                Filtrando por idioma
              </span>
            )}
          </div>

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center bg-dark-800/50 rounded-lg border border-dark-700">
              <p className="text-dark-400">
                {isAll
                  ? 'Este manga no tiene capítulos disponibles.'
                  : isSpanish
                  ? 'Este manga no tiene capítulos disponibles en español.'
                  : 'Este manga no tiene capítulos disponibles en inglés.'}
              </p>
              <p className="text-xs text-dark-500 mt-2">
                El idioma se verifica por capítulo, no solo por manga.
              </p>
            </div>
          )}

          <ChapterList
            chapters={filteredChapters}
            onChapterSelect={handleChapterSelect}
          />
        </section>
      </main>
    </div>
  );
}
