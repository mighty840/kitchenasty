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

export default function CozyFeatures({ features, t }: FeaturesProps) {
  const items = features?.length ? features : getDefaultFeatures(t);

  return (
    <section className="py-16 px-4 bg-amber-50/50 dark:bg-amber-950/20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-100 text-center mb-10">
          {t('home.whyChooseUs')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((feature, i) => (
            <div
              key={i}
              className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-7 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/60 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300 mb-5">
                {defaultIcons[feature.icon] ?? (
                  <span className="text-lg font-medium">{feature.icon}</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-amber-700/70 dark:text-amber-300/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
