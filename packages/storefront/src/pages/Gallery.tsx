import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi.js';

type GalleryCategory = 'FOOD' | 'INTERIOR' | 'GARDEN' | 'EVENTS';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  category: GalleryCategory;
  sortOrder: number;
}

type Filter = 'ALL' | GalleryCategory;

const FILTER_KEYS: Record<Filter, string> = {
  ALL: 'gallery.all',
  FOOD: 'gallery.food',
  INTERIOR: 'gallery.interior',
  GARDEN: 'gallery.garden',
  EVENTS: 'gallery.events',
};

const FILTERS: Filter[] = ['ALL', 'FOOD', 'INTERIOR', 'GARDEN', 'EVENTS'];

export default function Gallery() {
  const { t } = useTranslation();
  const { data: images, error, isLoading } = useApi<GalleryImage[]>('/api/gallery');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

  const filtered = useMemo(() => {
    if (!images) return [];
    if (filter === 'ALL') return images;
    return images.filter((img) => img.category === filter);
  }, [images, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('gallery.title')}</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('gallery.subtitle')}</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={filter === f}
          >
            {t(FILTER_KEYS[f])}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label="Loading" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
          {t('common.error')}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">{t('gallery.empty')}</p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((img) => (
            <button
              key={img.id}
              onClick={() => setLightbox(img)}
              className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={img.alt}
            >
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">{img.alt}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.alt}
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
