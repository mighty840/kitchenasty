import { Link } from 'react-router-dom';

interface CtaProps {
  cta: { title?: string; description?: string; buttonText?: string; buttonLink?: string } | null;
  t: (key: string) => string;
}

export default function RusticCta({ cta, t }: CtaProps) {
  const title = cta?.title || t('home.readyToOrder');
  const description = cta?.description || t('home.readyToOrderDesc');
  const buttonText = cta?.buttonText || t('home.createAccount');
  const buttonLink = cta?.buttonLink || '/register';

  return (
    <section className="py-20 bg-stone-100 dark:bg-stone-900/40">
      <div className="max-w-4xl mx-auto px-4">
        <div
          className="relative border border-stone-300 dark:border-stone-700 rounded-sm px-8 py-14 md:px-16 text-center"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0v40M0 20h40\' stroke=\'%23a8a29e\' stroke-width=\'.3\' opacity=\'.15\'/%3E%3C/svg%3E")',
          }}
        >
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-stone-800 dark:text-stone-200 mb-4">
            {title}
          </h2>
          <p className="text-lg text-stone-600 dark:text-stone-400 mb-10 max-w-lg mx-auto">
            {description}
          </p>
          <Link
            to={buttonLink}
            className="inline-block px-8 py-3 bg-stone-800 dark:bg-stone-200 text-stone-50 dark:text-stone-900 font-medium rounded-sm hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
