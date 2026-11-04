import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Chapter, Page } from '@/models';
import { providerService } from '@/providers/providerService';
import { useContinueReading } from '@/hooks/useContinueReading';
import MangaReader from '@/components/MangaReader';
import ReaderControls from '@/components/ReaderControls';

type LoadState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface ChapterNavigation {
  previous?: Chapter;
  next?: Chapter;
}

export default function Reader() {
  const router = useRouter();
  const { mangaId, chapterId } = router.query as { mangaId: string; chapterId: string };
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { save: saveContinueReading } = useContinueReading();

  const loadChapter = useCallback(async () => {
    setLoadState('loading');
    setErrorMessage(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        // Usar el endpoint de Comix API para obtener páginas del capítulo
        const response = await fetch(`/api/comix/chapter/${encodeURIComponent(chapterId)}/pages`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status} al cargar páginas`);
        }

        const data = await response.json();
        const fetchedPages: Page[] = data.pages || [];

        setPages(fetchedPages);

        if (fetchedPages.length === 0) {
          setLoadState('empty');
        } else {
          setLoadState('success');
        }

        // Guardar en historial de continuar leyendo
        const mangaTitle = chapter?.title || mangaId;
        saveContinueReading({
          mangaId,
          title: mangaTitle,
          chapterId,
          chapterNumber: chapter?.number,
          chapterTitle: chapter?.title,
          scrollPosition: 0,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('[Reader] Error loading chapter pages:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('El tiempo de espera se agotó al cargar el capítulo.');
      } else {
        setErrorMessage('No se pudieron cargar las páginas del capítulo.');
      }
      setLoadState('error');
    }
  }, [chapterId, mangaId, chapter, saveContinueReading]);

  const loadChapters = useCallback(async () => {
    try {
      const chapters = await providerService.getChapters(mangaId, 'es');
      setAllChapters(chapters);

      const currentChapter = chapters.find((c) => c.id === chapterId);
      if (currentChapter) {
        setChapter(currentChapter);
      }
    } catch {
      console.error('[Reader] Error cargando capítulos');
    }
  }, [mangaId, chapterId]);

  useEffect(() => {
    loadChapter();
    loadChapters();
  }, [loadChapter, loadChapters]);

  // Encontrar capítulos anterior y siguiente
  const currentIndex = allChapters.findIndex((c) => c.id === chapterId);
  const previousChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : undefined;
  const nextChapter =
    currentIndex >= 0 && currentIndex < allChapters.length - 1
      ? allChapters[currentIndex + 1]
      : undefined;

  const handlePreviousChapter = () => {
    if (previousChapter) {
      router.push(`/reader/${mangaId}/${previousChapter.id}`);
    }
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      router.push(`/reader/${mangaId}/${nextChapter.id}`);
    }
  };

  const handlePageError = (pageIndex: number) => {
    console.error(`[Reader] Error cargando página ${pageIndex + 1}`);
  };

  // Estados de visualización
  if (loadState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-900">
        <p className="text-dark-400">Cargando capítulo...</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-900 text-dark-400">
        <p>{errorMessage || 'Error al cargar el capítulo.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-100 rounded border border-dark-600"
        >
          Volver al manga
        </button>
      </div>
    );
  }

  if (loadState === 'empty' || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark-900 text-dark-400">
        <p>Este capítulo no tiene páginas disponibles.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-100 rounded border border-dark-600"
        >
          Volver al manga
        </button>
      </div>
    );
  }

  const chapterNumber = chapter?.number || '?';
  const chapterTitle = chapter?.title;

  return (
    <div className="min-h-screen bg-dark-900">
      <Head>
        <title>Lector - {chapterTitle || 'Capítulo ' + chapterNumber}</title>
      </Head>

      <nav className="border-b border-dark-700 bg-dark-900/50 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-12">
          <button
            onClick={() => router.back()}
            className="text-dark-400 hover:text-dark-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al manga
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8">
        <MangaReader pages={pages} onPageError={handlePageError} />
      </div>

      <ReaderControls
        onPreviousChapter={handlePreviousChapter}
        onNextChapter={handleNextChapter}
        onBackToManga={() => router.back()}
        hasPrevious={!!previousChapter}
        hasNext={!!nextChapter}
        currentChapter={chapterNumber}
        currentChapterTitle={chapterTitle}
        totalChapters={allChapters.length}
      />
    </div>
  );
}
