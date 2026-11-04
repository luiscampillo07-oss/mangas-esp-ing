import Link from 'next/link';
import { Chapter } from '@/models';
import { getLanguageName, isSpanish } from '@/utils/language';

interface ChapterListProps {
  chapters: Chapter[];
  onChapterSelect: (chapter: Chapter) => void;
}

interface ChapterListItemProps {
  chapter: Chapter;
  onSelect: () => void;
  isSpanish: boolean;
}

function ChapterListItem({ chapter, onSelect, isSpanish }: ChapterListItemProps) {
  return (
    <Link
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="flex items-center justify-between p-3 bg-dark-800 rounded border border-dark-700 hover:bg-dark-700 cursor-pointer transition-colors group"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-dark-100 group-hover:text-accent-purple">
            Capítulo {chapter.number || '?'}
          </span>
          {chapter.title && (
            <span className="text-sm text-dark-400 truncate">{chapter.title}</span>
          )}
        </div>
        <p className="text-xs text-dark-500 mt-0.5">
          {getLanguageName(chapter.language)} · {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString('es-ES') : ''}
        </p>
      </div>
      <span className={`text-xs font-mono ${isSpanish ? 'text-green-400' : 'text-dark-500'}`}>
        {isSpanish ? 'ES' : chapter.language.toUpperCase()}
      </span>
    </Link>
  );
}

export default function ChapterList({ chapters, onChapterSelect }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400">No hay capítulos disponibles en español.</p>
      </div>
    );
  }

  // Ordenar capítulos: orden descendente por defecto (más reciente primero)
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = parseFloat(a.number || '0');
    const bNum = parseFloat(b.number || '0');
    if (aNum !== bNum) return bNum - aNum;
    return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
  });

  return (
    <div className="space-y-1">
      {sortedChapters.map((chapter) => (
        <ChapterListItem
          key={chapter.id}
          chapter={chapter}
          onSelect={() => onChapterSelect(chapter)}
          isSpanish={isSpanish(chapter.language)}
        />
      ))}
    </div>
  );
}
