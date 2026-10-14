// The store listing text must be complete before a release: no empty field,
// nothing over a store's length limit, and nothing that must stay out of a
// public repo. Exits 1 and lists what is wrong.
const fs = require('fs');

const apple = require('../store.config.json').apple;
const { info } = apple;
const playDir = `${__dirname}/../store/google-play`;

// English (U.K.) and Spanish (Mexico) reuse the English and Spanish text.
const COPIES = { 'en-GB': 'en-US', 'es-MX': 'es-ES' };
const APPLE = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'es-MX', 'it', 'nl-NL', 'pt-BR'];
const APPLE_MAX = { title: 30, subtitle: 30, promoText: 170, description: 4000, releaseNotes: 4000 };
const APPLE_URLS = ['marketingUrl', 'supportUrl', 'privacyPolicyUrl'];
const SHOTS = '../design/store-screenshots/final/apple/phone-1320x2868/';
// Google Play folder -> the App Store language its name and description come from.
const PLAY = { 'en-US': 'en-US', 'de-DE': 'de-DE', 'fr-FR': 'fr-FR', 'es-ES': 'es-ES', 'it-IT': 'it', 'nl-NL': 'nl-NL', 'pt-BR': 'pt-BR' };
const PLAY_MAX = { title: 30, short_description: 80, full_description: 4000 };

let bad = 0;
const fail = (msg) => { console.log(msg); bad += 1; };
const size = (s) => [...s].length;

// The repo is public, and a push must change text only.
for (const key of Object.keys(apple)) {
  if (key !== 'copyright' && key !== 'info') fail(`apple: ${key} must stay out of the file`);
}

for (const lang of APPLE) {
  const text = info[lang];
  if (!text) { fail(`apple ${lang}: missing`); continue; }
  // Only the finished iPhone pictures, never what metadata:pull downloads.
  for (const [type, files] of Object.entries(text.screenshots ?? {})) {
    if (type !== 'APP_IPHONE_67') fail(`apple ${lang}: screenshots ${type} not expected`);
    for (const file of files) {
      if (!file.startsWith(SHOTS)) fail(`apple ${lang}: screenshot ${file} is not under ${SHOTS}`);
      else if (!fs.existsSync(`${__dirname}/../${file}`)) fail(`apple ${lang}: screenshot ${file} is missing`);
    }
  }
  for (const [field, max] of Object.entries(APPLE_MAX)) {
    const value = text[field] ?? '';
    if (!value.trim()) fail(`apple ${lang}: empty ${field}`);
    if (size(value) > max) fail(`apple ${lang}: ${field} is ${size(value)}, limit ${max}`);
  }
  const keywords = (text.keywords ?? []).join(',');
  if (!keywords) fail(`apple ${lang}: empty keywords`);
  if (size(keywords) > 100) fail(`apple ${lang}: keywords are ${size(keywords)}, limit 100`);
  for (const url of APPLE_URLS) if (!text[url]) fail(`apple ${lang}: empty ${url}`);
  const from = COPIES[lang];
  if (from && JSON.stringify(text) !== JSON.stringify(info[from])) {
    fail(`apple ${lang}: differs from ${from}`);
  }
}
for (const lang of Object.keys(info)) {
  if (!APPLE.includes(lang)) fail(`apple ${lang}: not one of the nine languages`);
}

for (const [lang, from] of Object.entries(PLAY)) {
  const read = (field) => {
    const file = `${playDir}/${lang}/${field}.txt`;
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\n$/, '') : '';
  };
  for (const [field, max] of Object.entries(PLAY_MAX)) {
    const text = read(field);
    if (!text.trim()) fail(`play ${lang}: empty ${field}`);
    if (size(text) > max) fail(`play ${lang}: ${field} is ${size(text)}, limit ${max}`);
  }
  const text = info[from] ?? {};
  if (read('title') !== text.title) fail(`play ${lang}: title differs from the App Store one`);
  if (read('full_description') !== text.description) fail(`play ${lang}: full_description differs from the App Store one`);
}

console.log(bad ? `${bad} problem(s)` : `ok: ${APPLE.length} App Store languages, ${Object.keys(PLAY).length} Google Play languages`);
process.exit(bad ? 1 : 0);
