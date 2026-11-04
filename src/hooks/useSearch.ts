import { useState, useCallback } from 'react';
import { Manga } from '@/models';
import { providerService } from '@/providers/providerService';

/**
 * Hook para búsqueda de mangas por título.
 */
export function useSearch() {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await providerService.searchManga(query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo realizar la búsqueda.');
      console.error('[useSearch] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear,
  };
}
