const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcons() {
  const root = path.resolve(__dirname, '..');
  const originalJpeg = path.join(root, 'public', 'logo.jpeg');

  // 1. Crop emblem from original logo.jpeg
  // bbox: minX: 497, maxX: 780, minY: 222, maxY: 543
  // Center is ~639, 382. Size 340x340.
  const { data, info } = await sharp(originalJpeg)
    .extract({ left: 469, top: 210, width: 340, height: 340 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  // Create RGBA buffer with transparent background
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      // Measure distance from cream background (approx 249, 248, 243)
      // Brightness / lightness
      const lightness = 0.299 * r + 0.587 * g + 0.114 * b;

      let alpha = 255;
      if (lightness >= 246) {
        alpha = 0;
      } else if (lightness >= 235) {
        // smooth anti-aliased edge
        const t = (246 - lightness) / (246 - 235);
        alpha = Math.round(t * 255);
      }

      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = alpha;
    }
  }

  const transparentEmblemPath = path.join(root, 'public', 'logo-icon.png');
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(transparentEmblemPath);

  // 2. Create the clean Squircle App Icon (512x512) for Apple Touch Icon, PWA & High-res Favicon
  // with subtle gradient & shadow, perfectly matching the original squircle
  const transparentEmblemBuf = await sharp(transparentEmblemPath)
    .resize(370, 370, { fit: 'contain' })
    .toBuffer();

  const squircleSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#FAF7F2"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#8C7A70" flood-opacity="0.12"/>
      </filter>
    </defs>
    <rect x="20" y="20" width="472" height="472" rx="108" fill="url(#bgGrad)" stroke="#EAE3D8" stroke-width="4" filter="url(#shadow)"/>
  </svg>`;

  const icon512 = await sharp(Buffer.from(squircleSvg))
    .composite([{ input: transparentEmblemBuf, top: 71, left: 71 }])
    .png()
    .toBuffer();

  await sharp(icon512).toFile(path.join(root, 'public', 'logo-app-icon.png'));

  // 3. Browser Tab Icons / Favicon
  // Tab icon 32x32: Next.js App Router uses src/app/icon.png
  await sharp(icon512).resize(32, 32).toFile(path.join(root, 'src', 'app', 'icon.png'));
  await sharp(icon512).resize(180, 180).toFile(path.join(root, 'src', 'app', 'apple-icon.png'));
  await sharp(icon512).resize(48, 48).toFile(path.join(root, 'src', 'app', 'favicon.ico'));
  await sharp(icon512).resize(48, 48).toFile(path.join(root, 'public', 'favicon.ico'));

  console.log('Successfully generated transparent emblem and all tab icons!');
}

createIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
