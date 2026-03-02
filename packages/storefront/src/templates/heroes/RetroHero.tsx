import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function RetroHero({ hero, t }: HeroProps) {
  return (
    <section className="relative bg-amber-50 dark:bg-gray-900 overflow-hidden min-h-[70vh] flex items-center">
      {/* Sepia-toned texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(180,140,80,0.08)_0%,transparent_70%)]" />

      {/* Retro dotted border frame */}
      <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-amber-300/40 dark:border-amber-700/30 rounded-lg pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        {/* Vintage stamp badge */}
        <div className="inline-flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-amber-600 dark:border-amber-500 flex items-center justify-center rotate-[-8deg]">
              <div className="w-20 h-20 rounded-full border-2 border-amber-600 dark:border-amber-500 flex items-center justify-center">
                <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  Est.
                </span>
              </div>
            </div>
          </div>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-900 dark:text-amber-100 mb-6 leading-tight"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {hero?.title || t('home.heroTitle')}
        </h1>

        {/* Retro divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="block w-12 h-0.5 bg-amber-400 dark:bg-amber-600" />
          <span className="block w-2 h-2 rotate-45 bg-amber-400 dark:bg-amber-600" />
          <span className="block w-12 h-0.5 bg-amber-400 dark:bg-amber-600" />
        </div>

        <p
          className="text-lg text-amber-800/70 dark:text-amber-300/70 mb-10 max-w-md mx-auto leading-relaxed italic"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {hero?.subtitle || t('home.heroDescription')}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to={hero?.ctaPrimaryLink || '/menu'}
            className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-amber-50 px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-sm border-2 border-amber-800 dark:border-amber-500 transition-colors shadow-md"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {hero?.ctaPrimaryText || t('home.viewMenu')}
          </Link>
          <Link
            to={hero?.ctaSecondaryLink || '/locations'}
            className="border-2 border-amber-700 dark:border-amber-500 text-amber-800 dark:text-amber-300 px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {hero?.ctaSecondaryText || t('home.findLocation')}
          </Link>
        </div>

        {/* Bottom vintage decoration */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <span className="text-amber-400 dark:text-amber-600 text-lg">&#10045;</span>
          <span className="text-amber-400 dark:text-amber-600 text-lg">&#10045;</span>
          <span className="text-amber-400 dark:text-amber-600 text-lg">&#10045;</span>
        </div>
      </div>
    </section>
  );
}
