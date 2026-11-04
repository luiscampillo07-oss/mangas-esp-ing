import { useState, useEffect, useCallback } from 'react';

export interface ContinueReadingEntry {
  mangaId: string;
  title: string;
  cover?: string;
  chapterId: string;
  chapterNumber?: string;
  chapterTitle?: string;
  scrollPosition: number;
  lastReadAt: string;
}

const STORAGE_KEY = 'mangas_continue_reading';
const MAX_ENTRIES = 10;

/**
 * Hook para gestionar el historial de "Continuar leyendo" en localStorage.
 * No guarda imágenes completas, solo metadatos ligeros.
 */
export function useContinueReading() {
  const [entries, setEntries] = useState<ContinueReadingEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch {
      setEntries([]);
    }
  }, []);

  const save = useCallback(
    (entry: Omit<ContinueReadingEntry, 'lastReadAt'>) => {
      try {
        const newEntry: ContinueReadingEntry = {
          ...entry,
          lastReadAt: new Date().toISOString(),
        };

        const updated = [newEntry, ...entries.filter((e) => e.mangaId !== entry.mangaId)].slice(
          0,
          MAX_ENTRIES
        );

        setEntries(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('[useContinueReading] Error guardando en localStorage:', error);
      }
    },
    [entries]
  );

  const remove = useCallback((mangaId: string) => {
    try {
      const updated = entries.filter((e) => e.mangaId !== mangaId);
      setEntries(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [entries]);

  const clear = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar
    }
  }, []);

  return {
    entries,
    save,
    remove,
    clear,
  };
}
