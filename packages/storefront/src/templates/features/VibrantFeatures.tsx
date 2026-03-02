interface FeaturesProps {
  features: Array<{ icon: string; title: string; description: string }> | null;
  t: (key: string) => string;
}

const defaultIcons: Record<string, React.ReactNode> = {
  clock: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  clipboard: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  calendar: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

const gradients = [
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-fuchsia-500 to-pink-500',
];

function getDefaultFeatures(t: (key: string) => string) {
  return [
    { icon: 'clock', title: t('home.fastDelivery'), description: t('home.fastDeliveryDesc') },
    { icon: 'clipboard', title: t('home.easyOrdering'), description: t('home.easyOrderingDesc') },
    { icon: 'calendar', title: t('home.tableReservations'), description: t('home.tableReservationsDesc') },
  ];
}

export default function VibrantFeatures({ features, t }: FeaturesProps) {
  const items = features?.length ? features : getDefaultFeatures(t);

  return (
    <section className="py-20 px-4 bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
          {t('home.whyChooseUs')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((feature, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className={`h-2 bg-gradient-to-r ${gradients[i % gradients.length]}`} />
              <div className="p-7">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white mb-5`}>
                  {defaultIcons[feature.icon] ?? (
                    <span className="text-lg font-bold">{feature.icon}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
