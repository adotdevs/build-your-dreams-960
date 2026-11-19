import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enActions from './locales/en/actions.json';
import enAdmin from './locales/en/admin.json';
import enPages from './locales/en/pages.json';

import frCommon from './locales/fr/common.json';
import frDashboard from './locales/fr/dashboard.json';
import frLanding from './locales/fr/landing.json';
import frAuth from './locales/fr/auth.json';
import frActions from './locales/fr/actions.json';
import frAdmin from './locales/fr/admin.json';
import frPages from './locales/fr/pages.json';

import deCommon from './locales/de/common.json';
import deDashboard from './locales/de/dashboard.json';
import deLanding from './locales/de/landing.json';
import deAuth from './locales/de/auth.json';
import deActions from './locales/de/actions.json';
import deAdmin from './locales/de/admin.json';
import dePages from './locales/de/pages.json';

import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arLanding from './locales/ar/landing.json';
import arAuth from './locales/ar/auth.json';
import arActions from './locales/ar/actions.json';
import arAdmin from './locales/ar/admin.json';
import arPages from './locales/ar/pages.json';

import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';
import esLanding from './locales/es/landing.json';
import esAuth from './locales/es/auth.json';
import esActions from './locales/es/actions.json';
import esAdmin from './locales/es/admin.json';
import esPages from './locales/es/pages.json';

import ptCommon from './locales/pt/common.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptLanding from './locales/pt/landing.json';
import ptAuth from './locales/pt/auth.json';
import ptActions from './locales/pt/actions.json';
import ptAdmin from './locales/pt/admin.json';
import ptPages from './locales/pt/pages.json';

import itCommon from './locales/it/common.json';
import itDashboard from './locales/it/dashboard.json';
import itLanding from './locales/it/landing.json';
import itAuth from './locales/it/auth.json';
import itActions from './locales/it/actions.json';
import itAdmin from './locales/it/admin.json';
import itPages from './locales/it/pages.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

const supportedLanguageCodes = languages.map((language) => language.code);

const normalizeDetectedLanguage = (language: string): LanguageCode => {
  const baseLanguage = language.toLowerCase().split(/[-_@.]/)[0];
  return supportedLanguageCodes.includes(baseLanguage as LanguageCode)
    ? baseLanguage as LanguageCode
    : 'en';
};

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    landing: enLanding,
    auth: enAuth,
    actions: enActions,
    admin: enAdmin,
    pages: enPages,
  },
  fr: {
    common: frCommon,
    dashboard: frDashboard,
    landing: frLanding,
    auth: frAuth,
    actions: frActions,
    admin: frAdmin,
    pages: frPages,
  },
  de: {
    common: deCommon,
    dashboard: deDashboard,
    landing: deLanding,
    auth: deAuth,
    actions: deActions,
    admin: deAdmin,
    pages: dePages,
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    landing: esLanding,
    auth: esAuth,
    actions: esActions,
    admin: esAdmin,
    pages: esPages,
  },
  pt: {
    common: ptCommon,
    dashboard: ptDashboard,
    landing: ptLanding,
    auth: ptAuth,
    actions: ptActions,
    admin: ptAdmin,
    pages: ptPages,
  },
  it: {
    common: itCommon,
    dashboard: itDashboard,
    landing: itLanding,
    auth: itAuth,
    actions: itActions,
    admin: itAdmin,
    pages: itPages,
  },
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    landing: arLanding,
    auth: arAuth,
    actions: arActions,
    admin: arAdmin,
    pages: arPages,
  },
};

const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  i18n.use(LanguageDetector);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguageCodes,
    load: 'languageOnly',
    cleanCode: true,
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'landing', 'auth', 'actions', 'admin', 'pages'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeDetectedLanguage,
    },
  });

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  if (typeof document === 'undefined') return;
  const language = languages.find(l => l.code === lng);
  if (language) {
    document.documentElement.dir = language.dir;
    document.documentElement.lang = lng;
    // Keep translate="no" to prevent browser extensions from breaking React
    document.documentElement.setAttribute('translate', 'no');
  }
});

export default i18n;