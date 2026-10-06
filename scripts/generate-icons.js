const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcons() {
  const root = path.resolve(__dirname, '..');
  const originalJpeg = path.join(root, 'public', 'logo.jpeg');

  // 1. Crop emblem from original logo.jpeg
  const { data, info } = await sharp(originalJpeg)
    .extract({ left: 450, top: 190, width: 380, height: 380 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const lightness = 0.299 * r + 0.587 * g + 0.114 * b;

      let alpha = 255;
      if (lightness >= 246) {
        alpha = 0;
      } else if (lightness >= 234) {
        const t = (246 - lightness) / (246 - 234);
        alpha = Math.round(t * 255);
      }

      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = alpha;
    }
  }

  // Convert raw rgba to png buffer first
  const pngBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  // Trim transparent edges so we have the exact emblem bounds
  const trimmed = await sharp(pngBuffer)
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });

  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  const targetSize = Math.max(tw, th) + 40; // 20px padding all around
  const padTop = Math.floor((targetSize - th) / 2);
  const padBottom = targetSize - th - padTop;
  const padLeft = Math.floor((targetSize - tw) / 2);
  const padRight = targetSize - tw - padLeft;

  const transparentEmblemPath = path.join(root, 'public', 'logo-icon.png');
  await sharp(trimmed.data)
    .extend({
      top: padTop,
      bottom: padBottom,
      left: padLeft,
      right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(360, 360)
    .png()
    .toFile(transparentEmblemPath);

  // 2. Create the clean Squircle App Icon (512x512) for Apple Touch Icon & Favicon
  const transparentEmblemBuf = await sharp(transparentEmblemPath)
    .resize(380, 380, { fit: 'contain' })
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
    .composite([{ input: transparentEmblemBuf, top: 66, left: 66 }])
    .png()
    .toBuffer();

  await sharp(icon512).toFile(path.join(root, 'public', 'logo-app-icon.png'));

  // 3. Browser Tab Icons / Favicon
  await sharp(icon512).resize(32, 32).toFile(path.join(root, 'src', 'app', 'icon.png'));
  await sharp(icon512).resize(180, 180).toFile(path.join(root, 'src', 'app', 'apple-icon.png'));
  await sharp(icon512).resize(48, 48).toFile(path.join(root, 'src', 'app', 'favicon.ico'));
  await sharp(icon512).resize(48, 48).toFile(path.join(root, 'public', 'favicon.ico'));

  console.log('Successfully re-centered and generated all icons!');
}

createIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
