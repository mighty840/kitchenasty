import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function RetroCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="py-20 bg-amber-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4">
        <div className="border-4 border-double border-amber-800 dark:border-amber-600 rounded-md px-8 py-14 md:px-16 text-center bg-white dark:bg-gray-800">
          {/* Decorative top ornament */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="block w-12 h-px bg-amber-800/40 dark:bg-amber-500/40" />
            <span className="text-amber-800 dark:text-amber-500 text-2xl">&#9733;</span>
            <span className="block w-12 h-px bg-amber-800/40 dark:bg-amber-500/40" />
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-900 dark:text-amber-100 mb-4">
            {title}
          </h2>
          <p className="text-lg text-amber-800/70 dark:text-amber-300/70 mb-10 max-w-lg mx-auto">
            {description}
          </p>
          <Link
            to={buttonLink}
            className="inline-block px-8 py-3 bg-amber-800 dark:bg-amber-600 text-amber-50 font-bold uppercase tracking-wider text-sm rounded-sm border-2 border-amber-900 dark:border-amber-500 hover:bg-amber-700 dark:hover:bg-amber-500 transition-colors shadow-[3px_3px_0_0_rgba(120,53,15,0.3)]"
          >
            {buttonText}
          </Link>

          {/* Decorative bottom ornament */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="block w-12 h-px bg-amber-800/40 dark:bg-amber-500/40" />
            <span className="text-amber-800 dark:text-amber-500 text-2xl">&#9733;</span>
            <span className="block w-12 h-px bg-amber-800/40 dark:bg-amber-500/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
