import { Link } from 'react-router-dom';

interface HeroProps {
  hero: { title?: string; subtitle?: string; ctaPrimaryText?: string; ctaPrimaryLink?: string; ctaSecondaryText?: string; ctaSecondaryLink?: string; backgroundImage?: string } | null;
  t: (key: string) => string;
}

export default function ModernHero({ hero, t }: HeroProps) {
  return (
    <section className="relative bg-gray-50 dark:bg-gray-950 overflow-hidden min-h-[70vh] flex items-center">
      {/* Gradient blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-3xl" />

      {/* Geometric shapes */}
      <div className="absolute top-20 left-[15%] w-20 h-20 border-2 border-primary-300/30 dark:border-primary-700/30 rotate-45" />
      <div className="absolute bottom-32 right-[20%] w-12 h-12 bg-primary-200/40 dark:bg-primary-800/20 rounded-full" />
      <div className="absolute top-1/2 right-[10%] w-32 h-1 bg-gradient-to-r from-primary-400/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Asymmetric text - takes 7 cols */}
          <div className="lg:col-span-7">
            <div className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              {hero?.subtitle || t('home.heroDescription')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-[1.1]">
              {hero?.title || t('home.heroTitle')}
            </h1>

            <div className="flex flex-wrap gap-4">
              <Link
                to={hero?.ctaPrimaryLink || '/menu'}
                className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
              >
                {hero?.ctaPrimaryText || t('home.viewMenu')}
              </Link>
              <Link
                to={hero?.ctaSecondaryLink || '/locations'}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-8 py-3.5 rounded-2xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md border border-gray-200 dark:border-gray-700"
              >
                {hero?.ctaSecondaryText || t('home.findLocation')}
              </Link>
            </div>
          </div>

          {/* Right side - image or decorative card */}
          <div className="lg:col-span-5 hidden lg:block">
            {hero?.backgroundImage ? (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-3xl blur-xl" />
                <img
                  src={hero.backgroundImage}
                  alt=""
                  className="relative rounded-3xl w-full h-80 object-cover shadow-2xl"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-3xl blur-xl" />
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fresh & Fast</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
