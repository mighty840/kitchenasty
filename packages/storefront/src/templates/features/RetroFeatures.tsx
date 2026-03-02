interface FeaturesProps {
  features: Array<{ icon: string; title: string; description: string }> | null;
  t: (key: string) => string;
}

const defaultIcons: Record<string, React.ReactNode> = {
  clock: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  clipboard: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  calendar: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

function getDefaultFeatures(t: (key: string) => string) {
  return [
    { icon: 'clock', title: t('home.fastDelivery'), description: t('home.fastDeliveryDesc') },
    { icon: 'clipboard', title: t('home.easyOrdering'), description: t('home.easyOrderingDesc') },
    { icon: 'calendar', title: t('home.tableReservations'), description: t('home.tableReservationsDesc') },
  ];
}

export default function RetroFeatures({ features, t }: FeaturesProps) {
  const items = features?.length ? features : getDefaultFeatures(t);

  return (
    <section className="py-16 px-4 bg-yellow-50 dark:bg-yellow-950/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-yellow-900 dark:text-yellow-100 mb-2 font-serif italic">
          {t('home.whyChooseUs')}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-12">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">&#9733;</span>
          <span className="h-px w-16 bg-yellow-400 dark:bg-yellow-700" />
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">&#9733;</span>
          <span className="h-px w-16 bg-yellow-400 dark:bg-yellow-700" />
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">&#9733;</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((feature, i) => (
            <div
              key={i}
              className="relative bg-white dark:bg-yellow-950/50 border-2 border-yellow-300 dark:border-yellow-800 rounded-lg p-7 text-center"
            >
              {/* Decorative corner accents */}
              <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-400 dark:border-yellow-700 rounded-tl" />
              <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-400 dark:border-yellow-700 rounded-tr" />
              <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-yellow-400 dark:border-yellow-700 rounded-bl" />
              <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-400 dark:border-yellow-700 rounded-br" />

              <div className="w-14 h-14 mx-auto rounded-full border-2 border-dashed border-yellow-400 dark:border-yellow-700 flex items-center justify-center text-yellow-700 dark:text-yellow-300 mb-5">
                {defaultIcons[feature.icon] ?? (
                  <span className="text-lg font-bold">{feature.icon}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2 font-serif">
                {feature.title}
              </h3>
              <p className="text-sm text-yellow-700/70 dark:text-yellow-300/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
