import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function VibrantCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">
          {title}
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
          {description}
        </p>
        <Link
          to={buttonLink}
          className="inline-block px-10 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
