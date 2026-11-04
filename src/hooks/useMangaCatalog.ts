import { useState, useEffect, useCallback } from 'react';
import { Manga } from '@/models';
import { providerService } from '@/providers/providerService';

/**
 * Hook para gestionar el catálogo de mangas con paginación.
 */
export function useMangaCatalog(initialPage = 1, initialLimit = 20) {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const loadCatalog = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await providerService.getCatalog(pageNum, initialLimit);
      if (append) {
        setMangas((prev) => [...prev, ...data]);
      } else {
        setMangas(data);
      }
      setHasMore(data.length === initialLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo. Inténtelo de nuevo más tarde.');
      console.error('[useMangaCatalog] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  useEffect(() => {
    loadCatalog(page, false);
  }, [page, loadCatalog]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  return {
    mangas,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => loadCatalog(page, false),
  };
}
