// Lightweight i18n: i18n-js + expo-localization.
// EN ships first; drop in locales/de.json (etc.) and register below later.
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

const en = require('./locales/en.json');

const i18n = new I18n({ en });
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
