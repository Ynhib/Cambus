import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import de from './locales/de.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)       // Détecte la langue du navigateur / OS automatiquement
  .use(initReactI18next)        // Passe l'instance i18n à react-i18next
  .init({
    resources: {
      fr: { translation: fr },
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: 'fr',           // Fallback : français si la langue n'est pas supportée
    supportedLngs: ['fr', 'de', 'en'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
