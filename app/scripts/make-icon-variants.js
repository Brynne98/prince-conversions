// Make the dark-mode icon files by recolouring the current icon art (AFC-24).
// The art is read from assets/adaptive-icon.png: "425°" in ink over a
// terracotta line and "400°", on a clear background, shrunk to Android's
// 66% safe zone. Writes:
//   assets/icon-ios-dark.png       iPhone, dark home screen (iOS 18+)
//   assets/icon-ios-tinted.png     iPhone, tinted home screen: grey on black,
//                                  iOS adds the colour
//   assets/adaptive-icon-monochrome.png  Android 13+ "Themed icons": only the
//                                  shape is used, Android adds the colours
//
// Run: node scripts/make-icon-variants.js

const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const SIZE = 1024;
const SAFE = Math.round(SIZE * 0.66);

// From PALETTES.dark in src/theme.js: cream, creamDeep, ink, terracotta.
const DARK = { bg: '#15110C', rule: '#221911', top: [242, 232, 216], bottom: [226, 120, 73] };
const TINTED = { bg: '#000000', rule: null, top: [255, 255, 255], bottom: [170, 170, 170] };
const WHITE = [255, 255, 255];

// The art with its two colours swapped for `top` and `bottom`.
async function recolour(top, bottom) {
  const { data, info } = await sharp(path.join(ASSETS, 'adaptive-icon.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    // Terracotta is far redder than it is blue; the ink is nearly grey.
    const [r, g, b] = data[i] - data[i + 2] > 60 ? bottom : top;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return sharp(data, { raw: info });
}

// A full square tile, as iOS wants: the art back at full size on `bg`, with
// the light icon's notebook lines when `rule` is set.
async function tile({ bg, rule, top, bottom }, file) {
  const offset = (SIZE - SAFE) / 2;
  const art = await (await recolour(top, bottom))
    .extract({ left: offset, top: offset, width: SAFE, height: SAFE })
    .resize(SIZE, SIZE)
    .png()
    .toBuffer();
  let lines = '';
  if (rule) {
    for (let y = SIZE * 0.06; y < SIZE; y += SIZE * 0.118) {
      lines += `<rect x="0" y="${Math.round(y)}" width="${SIZE}" height="4" fill="${rule}"/>`;
    }
  }
  const paper = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
      `<rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${lines}</svg>`
  );
  await sharp(paper)
    .composite([{ input: art }])
    .removeAlpha()
    .png()
    .toFile(path.join(ASSETS, file));
}

async function main() {
  await tile(DARK, 'icon-ios-dark.png');
  await tile(TINTED, 'icon-ios-tinted.png');
  await (await recolour(WHITE, WHITE)).png().toFile(path.join(ASSETS, 'adaptive-icon-monochrome.png'));
  console.log('icon variants written to', ASSETS);
}

main().catch(e => { console.error(e); process.exit(1); });
