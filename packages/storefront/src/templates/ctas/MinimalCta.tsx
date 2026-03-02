import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function MinimalCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="py-20">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-3">
          {title}
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
          {description}
        </p>
        <Link
          to={buttonLink}
          className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-4 decoration-1 hover:decoration-2 transition-all"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
