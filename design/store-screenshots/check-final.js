// Every store picture in final/ must exist at the exact pixel size its store
// asks for. Exits 1 and lists what is missing or the wrong size.
// Run: node check-final.js
const fs = require('fs');

const LANGS = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pt'];
const SLIDES = ['01-hero', '02-device-bottom', '03-two-devices', '04-device-bottom', '05-no-device', '06-two-devices'];
// [folder under final/, width, height, languages ('' = English files directly in the folder)]
const SETS = [
  ['apple/phone-1320x2868', 1320, 2868, LANGS],
  ['apple/phone-1284x2778', 1284, 2778, ['']],
  ['apple/phone-1206x2622', 1206, 2622, ['']],
  ['apple/phone-1125x2436', 1125, 2436, ['']],
];

let bad = 0, seen = 0;
for (const [dir, w, h, langs] of SETS) {
  for (const lang of langs) {
    for (const slide of SLIDES) {
      const file = `${__dirname}/final/${dir}/${lang && `${lang}/`}${slide}.png`;
      seen += 1;
      if (!fs.existsSync(file)) { console.log(`missing ${file}`); bad += 1; continue; }
      // A PNG keeps its width and height at bytes 16 to 24.
      const head = Buffer.alloc(24);
      fs.readSync(fs.openSync(file, 'r'), head, 0, 24, 0);
      const [gotW, gotH] = [head.readUInt32BE(16), head.readUInt32BE(20)];
      if (gotW !== w || gotH !== h) { console.log(`${file}: ${gotW}x${gotH}, want ${w}x${h}`); bad += 1; }
    }
  }
}
console.log(bad ? `${bad} problem(s)` : `ok: ${seen} pictures`);
process.exit(bad ? 1 : 0);
