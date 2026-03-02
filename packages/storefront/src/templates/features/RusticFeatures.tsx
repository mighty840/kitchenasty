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

export default function RusticFeatures({ features, t }: FeaturesProps) {
  const items = features?.length ? features : getDefaultFeatures(t);

  return (
    <section className="py-16 px-4 bg-stone-100 dark:bg-stone-900">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 text-center mb-3 font-serif">
          {t('home.whyChooseUs')}
        </h2>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="h-px w-10 bg-stone-400 dark:bg-stone-600" />
          <span className="text-stone-400 dark:text-stone-500 text-xs">&#9830;</span>
          <span className="h-px w-10 bg-stone-400 dark:bg-stone-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((feature, i) => (
            <div
              key={i}
              className="bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-lg p-7 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-full border-2 border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 mb-5">
                {defaultIcons[feature.icon] ?? (
                  <span className="text-lg font-medium">{feature.icon}</span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-2 font-serif">
                {feature.title}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
