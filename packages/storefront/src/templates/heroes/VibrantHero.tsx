import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function VibrantHero({ hero, t }: HeroProps) {
  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-center">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500"
        style={{
          backgroundSize: '200% 200%',
          animation: 'vibrant-gradient 8s ease infinite',
        }}
      />

      {/* Animated accent blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-yellow-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Inline keyframes for gradient animation */}
      <style>{`
        @keyframes vibrant-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[0.95] drop-shadow-lg">
          {hero?.title || t('home.heroTitle')}
        </h1>

        <p className="text-xl text-white/90 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
          {hero?.subtitle || t('home.heroDescription')}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to={hero?.ctaPrimaryLink || '/menu'}
            className="bg-white text-primary-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-100 transition-colors shadow-xl shadow-black/20"
          >
            {hero?.ctaPrimaryText || t('home.viewMenu')}
          </Link>
          <Link
            to={hero?.ctaSecondaryLink || '/locations'}
            className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
          >
            {hero?.ctaSecondaryText || t('home.findLocation')}
          </Link>
        </div>
      </div>
    </section>
  );
}
