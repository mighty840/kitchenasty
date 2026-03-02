import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function RusticHero({ hero, t }: HeroProps) {
  const bgStyle = hero?.backgroundImage
    ? { backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <section
      className="relative bg-stone-100 dark:bg-stone-900 min-h-[70vh] flex items-center"
      style={bgStyle}
    >
      {/* Textured overlay */}
      {hero?.backgroundImage && <div className="absolute inset-0 bg-stone-900/60" />}

      {/* Decorative grain texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        {/* Rustic divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="block w-16 h-px bg-amber-700/50 dark:bg-amber-500/50" />
          <svg className="w-6 h-6 text-amber-700 dark:text-amber-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
          </svg>
          <span className="block w-16 h-px bg-amber-700/50 dark:bg-amber-500/50" />
        </div>

        <h1
          className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${hero?.backgroundImage ? 'text-amber-50' : 'text-stone-800 dark:text-stone-100'}`}
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {hero?.title || t('home.heroTitle')}
        </h1>

        <p className={`text-lg mb-10 max-w-xl mx-auto leading-relaxed ${hero?.backgroundImage ? 'text-stone-200' : 'text-stone-600 dark:text-stone-400'}`}>
          {hero?.subtitle || t('home.heroDescription')}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to={hero?.ctaPrimaryLink || '/menu'}
            className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-md"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {hero?.ctaPrimaryText || t('home.viewMenu')}
          </Link>
          <Link
            to={hero?.ctaSecondaryLink || '/locations'}
            className={`px-8 py-3.5 rounded-lg font-semibold transition-colors border-2 ${hero?.backgroundImage ? 'border-amber-200/50 text-amber-100 hover:bg-amber-200/10' : 'border-stone-400 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'}`}
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {hero?.ctaSecondaryText || t('home.findLocation')}
          </Link>
        </div>

        {/* Bottom rustic divider */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <span className="block w-24 h-px bg-amber-700/30 dark:bg-amber-500/30" />
          <span className="block w-2 h-2 rounded-full bg-amber-700/40 dark:bg-amber-500/40" />
          <span className="block w-24 h-px bg-amber-700/30 dark:bg-amber-500/30" />
        </div>
      </div>
    </section>
  );
}
