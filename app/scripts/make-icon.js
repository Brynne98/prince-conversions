// Generate icon.png, adaptive-icon.png, splash.png, favicon.png
// Aesthetic: cream background, terracotta rounded square with conversion arrows
// glyph in cream — evokes oven ↔ air fryer conversion.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CREAM = '#FAF5EC';
const CREAM_DEEP = '#E2D6BD';
const TERRACOTTA = '#C2562E';
const TERRACOTTA_DEEP = '#A8451F';
const INK = '#2A1F18';

// iOS icons are square; the OS masks them. We fill the full canvas with the
// terracotta tile (no inner padding) so the masked corners look intentional.
const iconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D86A3E"/>
      <stop offset="55%" stop-color="${TERRACOTTA}"/>
      <stop offset="100%" stop-color="${TERRACOTTA_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="32%" cy="22%" r="80%">
      <stop offset="0%" stop-color="rgba(255,247,238,0.30)"/>
      <stop offset="60%" stop-color="rgba(255,247,238,0)"/>
    </radialGradient>
  </defs>

  <!-- terracotta tile fills the whole canvas; iOS masks the corners -->
  <rect width="1024" height="1024" fill="url(#tile)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- degree mark, geometric -->
  <circle cx="512" cy="330" r="92" fill="none" stroke="${CREAM}" stroke-width="58"/>

  <!-- "F" serif-ish, clean -->
  <g fill="${CREAM}">
    <rect x="358" y="498" width="308" height="58" rx="8"/>
    <rect x="358" y="498" width="58" height="380" rx="8"/>
    <rect x="358" y="650" width="220" height="56" rx="8"/>
  </g>
</svg>`;

const adaptiveFgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D86A3E"/>
      <stop offset="55%" stop-color="${TERRACOTTA}"/>
      <stop offset="100%" stop-color="${TERRACOTTA_DEEP}"/>
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="320" fill="url(#tile)"/>
  <circle cx="512" cy="380" r="78" fill="none" stroke="${CREAM}" stroke-width="48"/>
  <g fill="${CREAM}">
    <rect x="386" y="500" width="252" height="48" rx="6"/>
    <rect x="386" y="500" width="48" height="312" rx="6"/>
    <rect x="386" y="624" width="180" height="46" rx="6"/>
  </g>
</svg>`;

const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2436" viewBox="0 0 1242 2436">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D86A3E"/>
      <stop offset="55%" stop-color="${TERRACOTTA}"/>
      <stop offset="100%" stop-color="${TERRACOTTA_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="2436" fill="${CREAM}"/>

  <g transform="translate(471, 1018)">
    <rect width="300" height="300" rx="68" fill="url(#tile)"/>
    <circle cx="150" cy="92" r="28" fill="none" stroke="${CREAM}" stroke-width="18"/>
    <g fill="${CREAM}">
      <rect x="104" y="142" width="92" height="18" rx="3"/>
      <rect x="104" y="142" width="18" height="116" rx="3"/>
      <rect x="104" y="190" width="68" height="16" rx="3"/>
    </g>
  </g>
</svg>`;

async function main() {
  const out = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  await sharp(Buffer.from(iconSvg()))
    .png()
    .toFile(path.join(out, 'icon.png'));

  await sharp(Buffer.from(adaptiveFgSvg))
    .png()
    .toFile(path.join(out, 'adaptive-icon.png'));

  await sharp(Buffer.from(splashSvg))
    .resize(1242, 2436)
    .png()
    .toFile(path.join(out, 'splash.png'));

  await sharp(Buffer.from(iconSvg()))
    .resize(48, 48)
    .png()
    .toFile(path.join(out, 'favicon.png'));

  console.log('icons written to', out);
}

main().catch(e => { console.error(e); process.exit(1); });
