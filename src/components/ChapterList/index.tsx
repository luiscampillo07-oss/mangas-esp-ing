import Link from 'next/link';
import { Chapter } from '@/models';
import { getLanguageName } from '@/utils/language';

interface ChapterListProps {
  chapters: Chapter[];
  onChapterSelect: (chapter: Chapter) => void;
}

export default function ChapterList({ chapters, onChapterSelect }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400">No hay capítulos disponibles en español.</p>
      </div>
    );
  }

  // Ordenar capítulos: los más recientes primero (por número descendente, luego por fecha)
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = parseFloat(a.number || '0');
    const bNum = parseFloat(b.number || '0');
    if (aNum !== bNum) return bNum - aNum;
    return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
  });

  return (
    <div className="space-y-1">
      {sortedChapters.map((chapter) => (
        <div
          key={chapter.id}
          onClick={() => onChapterSelect(chapter)}
          className="flex items-center justify-between p-3 bg-dark-800 rounded border border-dark-700 hover:bg-dark-700 cursor-pointer transition-colors group"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-dark-100 group-hover:text-accent-purple">
                Capítulo {chapter.number || '?'}
              </span>
              {chapter.title && (
                <span className="text-sm text-dark-400">{chapter.title}</span>
              )}
            </div>
            <p className="text-xs text-dark-500 mt-0.5">
              {getLanguageName(chapter.language)} · {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString('es-ES') : ''}
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-dark-500 group-hover:text-accent-purple transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ))}
    </div>
  );
}
