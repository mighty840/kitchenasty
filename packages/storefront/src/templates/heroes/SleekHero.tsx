import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function SleekHero({ hero, t }: HeroProps) {
  return (
    <section className="relative bg-gray-950 overflow-hidden min-h-[70vh] flex items-center">
      {/* Subtle glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary-500/8 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 bg-gray-800/80 border border-gray-700 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          {hero?.subtitle || t('home.heroDescription')}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
          {(hero?.title || t('home.heroTitle')).split(' ').map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary-400">
                {word}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </h1>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to={hero?.ctaPrimaryLink || '/menu'}
            className="relative group bg-gradient-to-r from-cyan-500 to-primary-500 text-white px-8 py-3.5 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
          >
            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500 to-primary-500 opacity-0 group-hover:opacity-100 blur transition-opacity" />
            <span className="relative">{hero?.ctaPrimaryText || t('home.viewMenu')}</span>
          </Link>
          <Link
            to={hero?.ctaSecondaryLink || '/locations'}
            className="border border-gray-700 text-gray-300 px-8 py-3.5 rounded-lg font-semibold hover:border-gray-500 hover:text-white transition-colors backdrop-blur-sm"
          >
            {hero?.ctaSecondaryText || t('home.findLocation')}
          </Link>
        </div>
      </div>
    </section>
  );
}
