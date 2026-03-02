import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function MinimalHero({ hero, t }: HeroProps) {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-900 dark:text-white mb-6 leading-snug">
          {hero?.title || t('home.heroTitle')}
        </h1>

        <p className="text-lg text-gray-500 dark:text-gray-400 mb-14 max-w-xl mx-auto leading-relaxed">
          {hero?.subtitle || t('home.heroDescription')}
        </p>

        <div className="flex flex-wrap justify-center gap-8">
          <Link
            to={hero?.ctaPrimaryLink || '/menu'}
            className="group text-gray-900 dark:text-white font-medium"
          >
            <span>{hero?.ctaPrimaryText || t('home.viewMenu')}</span>
            <span className="block h-px w-0 group-hover:w-full bg-gray-900 dark:bg-white transition-all duration-300 mt-1" />
          </Link>
          <Link
            to={hero?.ctaSecondaryLink || '/locations'}
            className="group text-gray-500 dark:text-gray-400 font-medium"
          >
            <span>{hero?.ctaSecondaryText || t('home.findLocation')}</span>
            <span className="block h-px w-0 group-hover:w-full bg-gray-500 dark:bg-gray-400 transition-all duration-300 mt-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
