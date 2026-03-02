import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function CozyCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="py-20 bg-amber-50 dark:bg-amber-950/20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900/30 px-8 py-14 md:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto">
            {description}
          </p>
          <Link
            to={buttonLink}
            className="inline-block px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/30"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
