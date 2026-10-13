// Lightweight i18n: i18n-js + expo-localization.
// The app follows the phone's language, and falls back to English.
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

const i18n = new I18n({
  en: require('./locales/en.json'),
  de: require('./locales/de.json'),
  fr: require('./locales/fr.json'),
  es: require('./locales/es.json'),
  it: require('./locales/it.json'),
  nl: require('./locales/nl.json'),
  pt: require('./locales/pt.json'),
});
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

const deviceTag = getLocales()[0]?.languageCode || 'en';
i18n.locale = i18n.translations[deviceTag] ? deviceTag : 'en';

export function t(key, options) {
  return i18n.t(key, options);
}

export function getLocale() {
  return i18n.locale;
}

export default i18n;
