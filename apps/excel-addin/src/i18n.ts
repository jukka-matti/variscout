import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fi from './locales/fi/translation.json';
import de from './locales/de/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';
import pt from './locales/pt/translation.json';
import it from './locales/it/translation.json';
import pl from './locales/pl/translation.json';
import nl from './locales/nl/translation.json';
import cs from './locales/cs/translation.json';
import ro from './locales/ro/translation.json';
import tr from './locales/tr/translation.json';
import sv from './locales/sv/translation.json';
import da from './locales/da/translation.json';
import no from './locales/no/translation.json';
import id from './locales/id/translation.json';
import vi from './locales/vi/translation.json';
import th from './locales/th/translation.json';
import hi from './locales/hi/translation.json';
import ko from './locales/ko/translation.json';

export const defaultNS = 'translation';
export const resources = {
  en: {
    translation: en,
  },
  fi: {
    translation: fi,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  pt: {
    translation: pt,
  },
  it: {
    translation: it,
  },
  pl: {
    translation: pl,
  },
  nl: {
    translation: nl,
  },
  cs: {
    translation: cs,
  },
  ro: {
    translation: ro,
  },
  tr: {
    translation: tr,
  },
  sv: {
    translation: sv,
  },
  da: {
    translation: da,
  },
  no: {
    translation: no,
  },
  id: {
    translation: id,
  },
  vi: {
    translation: vi,
  },
  th: {
    translation: th,
  },
  hi: {
    translation: hi,
  },
  ko: {
    translation: ko,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    resources,
  });

export default i18n;
