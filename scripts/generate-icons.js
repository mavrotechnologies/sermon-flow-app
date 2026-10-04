/**
 * Generate PWA icons, the apple-touch-icon and a real multi-size favicon.ico.
 *
 * Run: node scripts/generate-icons.js
 * Requires: npm install --save-dev sharp
 *
 * The mark is the same open book with a soundwave spine used by
 * components/ui/Logo.tsx, on the evergreen/paper palette from app/globals.css.
 * Keep the two in sync — if the Logo path changes, re-run this script.
 */
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

/* Design tokens — must match app/globals.css */
const EVERGREEN = '#1f5d4c';
const PAPER = '#fbfaf6';

/* The book path from components/ui/Logo.tsx, authored in a 24x24 viewBox.
   Its visible ink spans x/y 4.5–19.5, i.e. 15 of the 24 units, centred on 12. */
const BOOK = 'M12 6.5C10.4 5.2 8.2 4.6 5.2 4.6a.7.7 0 0 0-.7.7v11.4c0 .4.3.7.7.7 3 0 5.2.6 6.8 1.9 1.6-1.3 3.8-1.9 6.8-1.9a.7.7 0 0 0 .7-.7V5.3a.7.7 0 0 0-.7-.7c-3 0-5.2.6-6.8 1.9Z';
const SPINE = 'M12 6.9v11.6';
const MARK_UNITS = 15;

/**
 * Build a 512x512 icon SVG.
 * @param {object} opts
 * @param {number} opts.coverage  Mark width as a fraction of the canvas.
 * @param {number} opts.stroke    Stroke width in the original 24-unit space.
 * @param {number|null} opts.radius  Corner radius in px, or null for full bleed.
 */
function iconSvg({ coverage, stroke, radius }) {
  const scale = (512 * coverage) / MARK_UNITS;
  const offset = 256 - 12 * scale; // map the 24-box centre onto the canvas centre
  const shape =
    radius === null
      ? '<rect width="512" height="512" fill="' + EVERGREEN + '"/>'
      : `<rect width="512" height="512" rx="${radius}" fill="${EVERGREEN}"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${shape}
  <g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${scale.toFixed(4)})"
     fill="none" stroke="${PAPER}" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${BOOK}"/>
    <path d="${SPINE}"/>
  </g>
</svg>`;
}

/* Standard icon: rounded square, 22% radius to match the Logo's rounded-[0.5rem] on a 2.25rem mark. */
const ICON_SVG = iconSvg({ coverage: 0.58, stroke: 1.55, radius: 114 });

/* Maskable: full bleed, mark kept inside the 80% safe zone so Android can crop to any shape. */
const MASKABLE_SVG = iconSvg({ coverage: 0.44, stroke: 1.7, radius: null });

/* Apple touch: full bleed — iOS applies its own squircle mask, so baked-in
   rounded corners would leave black wedges. */
const APPLE_SVG = iconSvg({ coverage: 0.54, stroke: 1.6, radius: null });

/* Favicon: bolder and larger so the book still reads at 16px. */
const FAVICON_SVG = iconSvg({ coverage: 0.66, stroke: 1.95, radius: 96 });

const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(publicDir, 'icons');

/** Pack PNG buffers into an ICO container (ICO supports embedded PNG). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette colours
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const render = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

async function generate() {
  for (const size of [192, 512]) {
    await fs.promises.writeFile(path.join(outDir, `icon-${size}x${size}.png`), await render(ICON_SVG, size));
    await fs.promises.writeFile(
      path.join(outDir, `icon-maskable-${size}x${size}.png`),
      await render(MASKABLE_SVG, size)
    );
    console.log(`Generated ${size}x${size} icons`);
  }

  await fs.promises.writeFile(path.join(outDir, 'apple-touch-icon.png'), await render(APPLE_SVG, 180));
  console.log('Generated apple-touch-icon.png (180x180, full bleed)');

  /* Crisp vector favicon for browsers that take one, plus the .ico fallback. */
  await fs.promises.writeFile(path.join(publicDir, 'icon.svg'), FAVICON_SVG.trimStart());
  console.log('Generated icon.svg');

  /* app/favicon.ico, not public/ — App Router serves the /favicon.ico route from
     app/, and having both files is a route conflict. */
  const icoSizes = [16, 32, 48];
  const images = [];
  for (const size of icoSizes) {
    images.push({ size, data: await render(FAVICON_SVG, size) });
  }
  await fs.promises.writeFile(path.join(__dirname, '..', 'app', 'favicon.ico'), buildIco(images));
  console.log(`Generated app/favicon.ico (${icoSizes.join(', ')}px)`);

  console.log('Done!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
