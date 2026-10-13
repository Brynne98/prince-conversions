// Every language file must hold the same keys and the same %{placeholders}
// as en.json. Exits 1 and lists what differs.
const dir = `${__dirname}/../src/i18n/locales`;
const langs = ['de', 'fr', 'es', 'it', 'nl', 'pt'];
const PLURAL = ['zero', 'one', 'other'];

const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => {
  if (typeof v !== 'object') return [[p + k, v]];
  // A plural: languages may differ in which forms they need.
  if ('other' in v) return [[p + k, PLURAL.map((f) => v[f] ?? v.other).join('|')]];
  return flat(v, `${p + k}.`);
});
const holes = (s) => (s.match(/%\{\w+\}/g) || []).sort().join();

const en = new Map(flat(require(`${dir}/en.json`)));
let bad = 0;
for (const lang of langs) {
  const other = new Map(flat(require(`${dir}/${lang}.json`)));
  for (const [key, text] of en) {
    if (!other.has(key)) { console.log(`${lang}: missing ${key}`); bad += 1; continue; }
    const there = other.get(key);
    if (!there.trim()) { console.log(`${lang}: empty ${key}`); bad += 1; }
    const want = new Set(holes(text).split(','));
    if ([...new Set(holes(there).split(','))].some((h) => !want.has(h))
      || [...want].some((h) => !there.includes(h))) {
      console.log(`${lang}: placeholders differ in ${key}`); bad += 1;
    }
  }
  for (const key of other.keys()) {
    if (!en.has(key)) { console.log(`${lang}: extra ${key}`); bad += 1; }
  }
}
console.log(bad ? `${bad} problem(s)` : `ok: ${langs.length} languages, ${en.size} keys each`);
process.exit(bad ? 1 : 0);
