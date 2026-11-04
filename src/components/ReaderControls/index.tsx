interface ReaderControlsProps {
  onPreviousChapter: () => void;
  onNextChapter: () => void;
   onBackToManga: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  currentChapter: string;
  totalChapters: number;
}

export default function ReaderControls({
  onPreviousChapter,
  onNextChapter,
  onBackToManga,
  hasPrevious,
  hasNext,
  currentChapter,
  totalChapters,
}: ReaderControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur border-t border-dark-700 p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBackToManga}
            disabled={false}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-100 rounded border border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al manga
          </button>

          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-dark-400 text-sm">
              Capítulo {currentChapter} de {totalChapters}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onPreviousChapter}
                disabled={!hasPrevious}
                className="px-4 py-2 rounded bg-dark-800 hover:bg-dark-700 text-dark-100 border border-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={onNextChapter}
                disabled={!hasNext}
                className="px-4 py-2 rounded bg-dark-800 hover:bg-dark-700 text-dark-100 border border-dark-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
