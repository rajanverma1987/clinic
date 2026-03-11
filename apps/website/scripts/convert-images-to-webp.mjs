/**
 * Converts PNG/JPG/JPEG in public/images to WebP with high quality (smaller size, same visual quality).
 * Run from repo root: node apps/website/scripts/convert-images-to-webp.mjs
 * Or from apps/website: node scripts/convert-images-to-webp.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public/images');
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif'];
const WEBP_QUALITY = 92; // high quality, good size reduction (1-100)
const WEBP_ALPHA_QUALITY = 100; // preserve transparency

function getAllImagePaths(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      getAllImagePaths(full, acc);
    } else if (EXTENSIONS.includes(path.extname(e.name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}

async function convertToWebp(inputPath) {
  const ext = path.extname(inputPath);
  const base = inputPath.slice(0, -ext.length);
  const outPath = base + '.webp';
  const hasAlpha = ['.png', '.gif'].includes(ext.toLowerCase());
  await sharp(inputPath)
    .webp({
      quality: WEBP_QUALITY,
      alphaQuality: hasAlpha ? WEBP_ALPHA_QUALITY : undefined,
      effort: 4,
    })
    .toFile(outPath);
  const inStat = fs.statSync(inputPath);
  const outStat = fs.statSync(outPath);
  const saved = ((1 - outStat.size / inStat.size) * 100).toFixed(1);
  console.log(`${path.relative(publicDir, inputPath)} → .webp (${saved}% smaller)`);
  return outPath;
}

async function main() {
  const files = getAllImagePaths(publicDir);
  if (files.length === 0) {
    console.log('No PNG/JPG/JPEG/GIF files found in public/images');
    return;
  }
  console.log(`Converting ${files.length} image(s) to WebP (quality ${WEBP_QUALITY})...\n`);
  for (const f of files) {
    try {
      await convertToWebp(f);
    } catch (err) {
      console.error(`Error converting ${f}:`, err.message);
    }
  }
  console.log('\nDone. Update code to use .webp paths.');
}

main();
