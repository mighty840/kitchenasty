import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function ModernCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="relative py-24 overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Geometric background pattern */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full border border-primary-300/20 dark:border-primary-700/20" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full border border-primary-300/20 dark:border-primary-700/20" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5">
          {title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
          {description}
        </p>
        <Link
          to={buttonLink}
          className="inline-block px-10 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 transition-all duration-200"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
