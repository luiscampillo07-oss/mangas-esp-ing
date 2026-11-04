import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Manga, Chapter } from '@/models';
import { providerService } from '@/providers/providerService';
import ChapterList from '@/components/ChapterList';
import { isSpanish, getLanguageName } from '@/utils/language';

export default function MangaDetails() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        // Obtener detalles del manga
        const mangaData = await providerService.getMangaDetails(id);
        if (!cancelled && mangaData) {
          setManga(mangaData);
        }

        // Obtener capítulos en español
        const chapterData = await providerService.getChapters(id, 'es');
        if (!cancelled) {
          setChapters(chapterData);
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

  const spanishChapters = chapters.filter((c) => isSpanish(c.language));

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
              />
            ) : (
              <div className="w-full h-96 bg-dark-800 rounded-lg flex items-center justify-center text-dark-500">
                Sin portada
              </div>
            )}
          </div>

          <div className="lg:w-2/3 flex flex-col">
            <h1 className="text-3xl font-bold mb-2">{manga.title}</h1>
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

        {/* Lista de capítulos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-dark-100">
              Capítulos ({spanishChapters.length})
            </h2>
            {spanishChapters.length < chapters.length && (
              <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-1 rounded">
                Algunos capítulos no están en español
              </span>
            )}
          </div>

          {spanishChapters.length === 0 && (
            <div className="p-8 text-center bg-dark-800/50 rounded-lg border border-dark-700">
              <p className="text-dark-400">
                Este manga no tiene capítulos disponibles en español.
              </p>
              <p className="text-xs text-dark-500 mt-2">
                El idioma se verifica por capítulo, no solo por manga.
              </p>
            </div>
          )}

          <ChapterList
            chapters={spanishChapters}
            onChapterSelect={handleChapterSelect}
          />
        </section>
      </main>
    </div>
  );
}
