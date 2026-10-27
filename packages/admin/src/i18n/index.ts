import i18n from 'i18next';
import type { TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const supportedCodes = SUPPORTED_LANGUAGES.map(({ code }) => code);
const storedLanguage = localStorage.getItem('language')?.split('-')[0];
const initialLanguage: LanguageCode = supportedCodes.includes(storedLanguage as LanguageCode)
  ? storedLanguage as LanguageCode
  : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    pt: { translation: pt },
    pl: { translation: pl },
    ru: { translation: ru },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: supportedCodes,
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLanguage;
i18n.on('languageChanged', (language) => {
  const code = supportedCodes.includes(language as LanguageCode) ? language : 'en';
  localStorage.setItem('language', code);
  document.documentElement.lang = code;
});

export default i18n;

export function translateStatus(t: TFunction, status: string) {
  const normalized = status.toLowerCase().replaceAll('_', '');
  return t(`status.${normalized}`, { defaultValue: status.replaceAll('_', ' ') });
}

export function translateRole(t: TFunction, role: string) {
  const normalized = role.toLowerCase();
  return t(`roles.${normalized}`, { defaultValue: role });
}
