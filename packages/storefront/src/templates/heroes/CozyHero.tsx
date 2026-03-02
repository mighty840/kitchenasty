import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function CozyHero({ hero, t }: HeroProps) {
  return (
    <section className="bg-amber-50 dark:bg-gray-900 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Background image or warm gradient */}
          {hero?.backgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${hero.backgroundImage})` }}
            >
              <div className="absolute inset-0 bg-amber-900/50" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-750" />
          )}

          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 lg:py-24 text-center">
            {/* Warm icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl mb-8">
              <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight ${hero?.backgroundImage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {hero?.title || t('home.heroTitle')}
            </h1>

            <p className={`text-lg mb-10 max-w-lg mx-auto leading-relaxed ${hero?.backgroundImage ? 'text-amber-100' : 'text-gray-600 dark:text-gray-300'}`}>
              {hero?.subtitle || t('home.heroDescription')}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to={hero?.ctaPrimaryLink || '/menu'}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30"
              >
                {hero?.ctaPrimaryText || t('home.viewMenu')}
              </Link>
              <Link
                to={hero?.ctaSecondaryLink || '/locations'}
                className={`px-8 py-3.5 rounded-xl font-semibold transition-colors ${hero?.backgroundImage ? 'border-2 border-white/50 text-white hover:bg-white/10' : 'border-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
              >
                {hero?.ctaSecondaryText || t('home.findLocation')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
