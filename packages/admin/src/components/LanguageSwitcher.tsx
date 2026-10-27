import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/index.js';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
      <span className="sr-only">{t('common.selectLanguage')}</span>
      <select
        value={language}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="text-sm bg-transparent border border-gray-300 rounded-md px-2 py-1 text-gray-600 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
        aria-label={t('common.selectLanguage')}
      >
        {SUPPORTED_LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
