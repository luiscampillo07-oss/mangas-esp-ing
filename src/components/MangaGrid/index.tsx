import MangaCard from '@/components/MangaCard';
import { Manga } from '@/models';

interface MangaGridProps {
  mangas: Manga[];
}

export default function MangaGrid({ mangas }: MangaGridProps) {
  if (mangas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">No se encontraron mangas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {mangas.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  );
}
