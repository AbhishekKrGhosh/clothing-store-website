import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import mongoose from 'mongoose';
import Image from '../models/Image.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { processImage, cacheGet, cacheSet, cacheDrop } from '../utils/image.js';

const r = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

// POST /api/images  (multipart "images", optional ?preset=product|hero|banner|category|lookbook|post|logo)
r.post('/', adminOnly, upload.array('images', 20), asyncH(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'No images uploaded' });
  const preset = req.query.preset || req.body.preset || 'default';
  const refs = [];
  for (const f of req.files) {
    // eslint-disable-next-line no-await-in-loop
    refs.push(await processImage(f.buffer, preset, f.originalname));
  }
  res.status(201).json(refs);
}));

// Library listing for the admin media picker
r.get('/', adminOnly, asyncH(async (req, res) => {
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 40);
  const [items, total] = await Promise.all([
    Image.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Image.countDocuments(),
  ]);
  const agg = await Image.aggregate([{ $group: { _id: null, bytes: { $sum: '$size' } } }]);
  res.json({
    items: items.map((d) => ({ id: String(d._id), url: `/api/images/${d._id}`, blur: d.blur, w: d.width, h: d.height, size: d.size, name: d.name, preset: d.preset, createdAt: d.createdAt })),
    total, page, pages: Math.ceil(total / limit), totalBytes: agg[0]?.bytes || 0,
  });
}));

// Remove images no longer referenced anywhere
r.post('/cleanup', adminOnly, asyncH(async (_req, res) => {
  const used = new Set();
  const collections = ['products', 'categories', 'brands', 'posts', 'singletons', 'orders'];
  const rx = /\/api\/images\/([a-f0-9]{24})/g;
  for (const c of collections) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await mongoose.connection.db.collection(c).find({}).toArray();
    for (const d of docs) for (const m of JSON.stringify(d).matchAll(rx)) used.add(m[1]);
  }
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // keep very recent uploads (maybe unsaved forms)
  const all = await Image.find({ createdAt: { $lt: cutoff } }, { _id: 1, size: 1 }).lean();
  const orphans = all.filter((d) => !used.has(String(d._id)));
  await Image.deleteMany({ _id: { $in: orphans.map((o) => o._id) } });
  orphans.forEach((o) => cacheDrop(String(o._id)));
  res.json({ removed: orphans.length, freedBytes: orphans.reduce((s, o) => s + (o.size || 0), 0) });
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Image.findByIdAndDelete(req.params.id);
  cacheDrop(req.params.id);
  res.json({ ok: true });
}));

// GET /api/images/:id?w=400 — serves the base64-stored image as binary with long-lived caching
const WIDTHS = [80, 160, 320, 480, 640, 800, 1000, 1200, 1600];
r.get('/:id', asyncH(async (req, res) => {
  const id = req.params.id.replace(/\.\w+$/, '');
  if (!mongoose.isValidObjectId(id)) return res.status(404).end();
  let w = parseInt(req.query.w, 10) || 0;
  if (w) w = WIDTHS.find((x) => x >= w) || 0;
  const key = `${id}:${w}`;

  const etag = `"${key}"`;
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  let hit = cacheGet(key);
  if (!hit) {
    const doc = await Image.findById(id).select('+data mime width').lean();
    if (!doc) return res.status(404).end();
    let buf = Buffer.from(doc.data, 'base64');
    if (w && doc.width && w < doc.width) buf = await sharp(buf).resize({ width: w }).webp({ quality: 76 }).toBuffer();
    hit = { buf, mime: doc.mime || 'image/webp' };
    cacheSet(key, hit);
  }
  res.type(hit.mime).send(hit.buf);
}));

export default r;
