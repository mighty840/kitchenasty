import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.js';
import { heroVariants } from '../templates/heroes/index.js';
import { featureVariants } from '../templates/features/index.js';
import { ctaVariants } from '../templates/ctas/index.js';
import type { TemplateId } from '../templates/index.js';

export default function Home() {
  const { t } = useTranslation();
  const { settings } = useTheme();

  const hero = settings.heroSection;
  const features = settings.featuresSection;
  const cta = settings.ctaSection;
  const templateId = (settings.storefrontTemplate || 'classic') as TemplateId;

  const HeroVariant = heroVariants[templateId];
  const FeaturesVariant = featureVariants[templateId];
  const CtaVariant = ctaVariants[templateId];

  return (
    <>
      {/* Hero */}
      {HeroVariant ? (
        <Suspense fallback={<div className="h-96 bg-primary-600" />}>
          <HeroVariant hero={hero} t={t} />
        </Suspense>
      ) : (
        <ClassicHero hero={hero} t={t} />
      )}

      {/* Features */}
      {FeaturesVariant ? (
        <Suspense fallback={<div className="h-64" />}>
          <FeaturesVariant features={features} t={t} />
        </Suspense>
      ) : (
        <ClassicFeatures features={features} t={t} />
      )}

      {/* CTA */}
      {CtaVariant ? (
        <Suspense fallback={<div className="h-48 bg-gray-100" />}>
          <CtaVariant cta={cta} t={t} />
        </Suspense>
      ) : (
        <ClassicCta cta={cta} t={t} />
      )}
    </>
  );
}

/* ── Classic variants (inline, matching original) ─────────────── */

interface HeroSection {
  title?: string;
  subtitle?: string;
  ctaPrimaryText?: string;
  ctaPrimaryLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  backgroundImage?: string;
}

function ClassicHero({ hero, t }: { hero: HeroSection | null; t: (k: string) => string }) {
  const heroStyle = hero?.backgroundImage
    ? { backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <section
      className="bg-gradient-to-br from-primary-600 to-primary-800 text-white"
      style={heroStyle}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28${hero?.backgroundImage ? ' bg-black/40' : ''}`}>
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {hero?.title || t('home.heroTitle')}
          </h1>
          <p className="text-lg text-primary-100 mb-8">
            {hero?.subtitle || t('home.heroDescription')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={hero?.ctaPrimaryLink || '/menu'}
              className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              {hero?.ctaPrimaryText || t('home.viewMenu')}
            </Link>
            <Link
              to={hero?.ctaSecondaryLink || '/locations'}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              {hero?.ctaSecondaryText || t('home.findLocation')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

function ClassicFeatures({ features, t }: { features: FeatureItem[] | null; t: (k: string) => string }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features && features.length > 0 ? (
          features.map((feature, i) => (
            <div key={i} className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))
        ) : (
          <>
            <FeatureCard icon="clock" title={t('home.fastDelivery')} description={t('home.fastDeliveryDesc')} />
            <FeatureCard icon="clipboard" title={t('home.easyOrdering')} description={t('home.easyOrderingDesc')} />
            <FeatureCard icon="calendar" title={t('home.tableReservations')} description={t('home.tableReservationsDesc')} />
          </>
        )}
      </div>
    </section>
  );
}

interface CtaSection {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

function ClassicCta({ cta, t }: { cta: CtaSection | null; t: (k: string) => string }) {
  return (
    <section className="bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {cta?.title || t('home.readyToOrder')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {cta?.description || t('home.readyToOrderDesc')}
        </p>
        <Link
          to={cta?.buttonLink || '/register'}
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          {cta?.buttonText || t('home.createAccount')}
        </Link>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const icons: Record<string, React.ReactNode> = {
    clock: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clipboard: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    calendar: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  };

  return (
    <div className="text-center p-6">
      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icons[icon] || icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}
