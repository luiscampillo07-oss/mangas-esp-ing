import { Manga } from '@/models';

/**
 * Detecta mangas duplicados basándose en sourceId y coincidencia de título.
 * No une automáticamente cuando existe incertidumbre.
 */
export function findDuplicates(mangas: Manga[]): { id: string; title: string; sources: string[] }[] {
  const bySourceId = new Map<string, Manga[]>();

  for (const manga of mangas) {
    const key = manga.sourceId;
    if (!bySourceId.has(key)) {
      bySourceId.set(key, []);
    }
    bySourceId.get(key)!.push(manga);
  }

  const duplicates: { id: string; title: string; sources: string[] }[] = [];

  for (const [sourceId, group] of Array.from(bySourceId.entries())) {
    if (group.length > 1) {
      duplicates.push({
        id: sourceId,
        title: group[0].title,
        sources: group.map((m) => m.sourceId),
      });
    }
  }

  return duplicates;
}

/**
 * Normaliza un título para comparación (minúsculas, sin espacios extra).
 */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, ' ');
}
