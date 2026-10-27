import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../../../storefront/src/i18n/locales/en.json';
import es from '../../../storefront/src/i18n/locales/es.json';
import fr from '../../../storefront/src/i18n/locales/fr.json';
import de from '../../../storefront/src/i18n/locales/de.json';
import it from '../../../storefront/src/i18n/locales/it.json';
import pt from '../../../storefront/src/i18n/locales/pt.json';
import pl from '../../../storefront/src/i18n/locales/pl.json';
import ru from '../../../storefront/src/i18n/locales/ru.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: 'GB' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'it', name: 'Italiano', flag: 'IT' },
  { code: 'pt', name: 'Português', flag: 'PT' },
  { code: 'pl', name: 'Polski', flag: 'PL' },
  { code: 'ru', name: 'Русский', flag: 'RU' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'language';

// Load saved language async, default to 'en'
AsyncStorage.getItem(LANGUAGE_KEY).then((lng) => {
  if (lng && lng !== i18n.language) {
    i18n.changeLanguage(lng);
  }
});

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
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
