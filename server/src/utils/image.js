import sharp from 'sharp';
import Image from '../models/Image.js';

/**
 * Every uploaded image is re-encoded to WebP, auto-rotated, stripped of metadata,
 * resized to a sensible maximum for its purpose and stored as base64 in MongoDB.
 * A tiny blurred placeholder is stored alongside for smooth blur-up loading.
 */
export const PRESETS = {
  product: { max: 1100, quality: 78 },
  hero: { max: 1800, quality: 76 },
  banner: { max: 1600, quality: 76 },
  category: { max: 800, quality: 78 },
  lookbook: { max: 1200, quality: 76 },
  post: { max: 1400, quality: 76 },
  logo: { max: 500, quality: 90 },
  avatar: { max: 300, quality: 80 },
  default: { max: 1200, quality: 78 },
};

export async function processImage(buffer, preset = 'default', originalName = '') {
  const { max, quality } = PRESETS[preset] || PRESETS.default;
  const base = sharp(buffer, { failOn: 'none' }).rotate();

  const { data, info } = await base
    .clone()
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const blurBuf = await base
    .clone()
    .resize({ width: 24, height: 24, fit: 'inside' })
    .webp({ quality: 35 })
    .toBuffer();

  const doc = await Image.create({
    name: originalName,
    mime: 'image/webp',
    data: data.toString('base64'),
    width: info.width,
    height: info.height,
    size: data.length,
    preset,
    blur: `data:image/webp;base64,${blurBuf.toString('base64')}`,
  });
  return toRef(doc);
}

export function toRef(doc) {
  return {
    id: String(doc._id),
    url: `/api/images/${doc._id}`,
    blur: doc.blur,
    w: doc.width,
    h: doc.height,
  };
}

// Small in-memory LRU for resized variants so repeat requests are instant
const cache = new Map();
const MAX_CACHE_BYTES = 80 * 1024 * 1024;
let cacheBytes = 0;

export function cacheGet(key) {
  const v = cache.get(key);
  if (v) {
    cache.delete(key);
    cache.set(key, v);
  }
  return v;
}

export function cacheSet(key, value) {
  cache.set(key, value);
  cacheBytes += value.buf.length;
  while (cacheBytes > MAX_CACHE_BYTES && cache.size) {
    const [k, v] = cache.entries().next().value;
    cache.delete(k);
    cacheBytes -= v.buf.length;
  }
}

export function cacheDrop(id) {
  for (const [k, v] of cache) {
    if (k.startsWith(id)) {
      cache.delete(k);
      cacheBytes -= v.buf.length;
    }
  }
}
