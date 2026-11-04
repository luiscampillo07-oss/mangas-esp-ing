import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '@/utils/language';

const STORAGE_KEY = 'mangas_language_filter';

export function useLanguageFilter() {
  const [language, setLanguage] = useState<SupportedLanguage | 'all'>('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'es' || stored === 'en' || stored === 'all') {
        setLanguage(stored as SupportedLanguage | 'all');
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const setLanguageFilter = useCallback(
    (newLanguage: SupportedLanguage | 'all') => {
      setLanguage(newLanguage);
      try {
        localStorage.setItem(STORAGE_KEY, newLanguage);
      } catch {
        // Ignorar errores de localStorage
      }
    },
    []
  );

  return {
    language,
    setLanguageFilter,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
    isAll: language === 'all',
  };
}
