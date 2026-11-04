import Link from 'next/link';
import { Manga } from '@/models';

interface MangaCardProps {
  manga: Manga;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <article className="group bg-dark-800 rounded-lg overflow-hidden border border-dark-700 hover:border-accent-purple transition-colors duration-200">
      {manga.cover ? (
        <Link href={`/manga/${manga.id}`} className="block relative aspect-[2/3]">
          <img
            src={manga.cover}
            alt={`Portada de ${manga.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
      ) : (
        <Link href={`/manga/${manga.id}`} className="block relative aspect-[2/3] flex items-center justify-center bg-dark-700">
          <span className="text-dark-400 text-sm">Sin portada</span>
        </Link>
      )}
      <div className="p-3">
        <Link href={`/manga/${manga.id}`} className="block">
          <h3 className="font-medium text-dark-100 group-hover:text-accent-purple transition-colors line-clamp-2">
            {manga.title}
          </h3>
        </Link>
        {manga.author && (
          <p className="text-xs text-dark-400 mt-1 line-clamp-1">{manga.author}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {manga.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="text-xs bg-dark-700 text-dark-200 px-2 py-0.5 rounded">
              {genre}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs text-dark-500">
          {manga.status} · {manga.chapters?.length || 0} cap.
        </div>
      </div>
    </article>
  );
}
