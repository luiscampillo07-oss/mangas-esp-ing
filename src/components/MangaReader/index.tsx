import { useState, useEffect, useCallback, useRef } from 'react';
import { Page } from '@/models';

interface MangaReaderProps {
  pages: Page[];
  onPageError?: (pageIndex: number) => void;
}

export default function MangaReader({ pages, onPageError }: MangaReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());
  const [retryPages, setRetryPages] = useState<Set<number>>(new Set());
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleImageError = useCallback((index: number) => {
    setErrorPages((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setRetryPages((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    onPageError?.(index);
  }, [onPageError]);

  const handleRetry = useCallback((index: number) => {
    setRetryPages((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setErrorPages((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    // Forzar re-render de la imagen cambiando su key temporalmente
    window.dispatchEvent(new CustomEvent('retry-image', { detail: { index } }));
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-dark-900 text-dark-400">
        <p>No hay páginas disponibles para este capítulo.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-2 bg-dark-900 min-h-screen p-2 md:p-4 overflow-y-auto"
      onScroll={handleScroll}
    >
      {pages.map((page, index) => (
        <div
          key={`page-${page.id}-${index}`}
          className="flex flex-col items-center w-full max-w-md mb-2"
        >
          <img
            src={page.imageUrl}
            alt={`Página ${page.order}`}
            className="w-full max-w-md h-auto object-contain rounded shadow-lg bg-dark-800"
            loading="lazy"
            decoding="async"
            onError={() => handleImageError(index)}
          />
          {errorPages.has(index) && (
            <div className="mt-2 flex flex-col items-center gap-2">
              <p className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded text-center">
                Imagen no disponible
              </p>
              <button
                onClick={() => handleRetry(index)}
                className="text-xs bg-dark-700 text-dark-200 px-3 py-1 rounded hover:bg-dark-600 transition-colors border border-dark-600"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      ))}
      <div className="h-24" />
    </div>
  );
}
