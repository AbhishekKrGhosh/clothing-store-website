import { Router } from 'express';
import Post from '../models/Post.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { uniqueSlug } from '../utils/slug.js';

const r = Router();
const FIELDS = ['title', 'excerpt', 'content', 'cover', 'author', 'tags', 'published', 'publishedAt'];
const body = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

r.get('/', optionalAuth, asyncH(async (req, res) => {
  const admin = req.user?.role === 'admin' && req.query.all;
  const f = admin ? {} : { published: true };
  const limit = Math.min(50, +req.query.limit || 20);
  res.json(await Post.find(f).select('-content').sort({ publishedAt: -1 }).limit(limit).lean());
}));

r.get('/:slug', optionalAuth, asyncH(async (req, res) => {
  const f = /^[a-f0-9]{24}$/.test(req.params.slug) ? { _id: req.params.slug } : { slug: req.params.slug };
  if (req.user?.role !== 'admin') f.published = true;
  const p = await Post.findOne(f).lean();
  if (!p) return res.status(404).json({ message: 'Story not found' });
  res.json(p);
}));

r.post('/', adminOnly, asyncH(async (req, res) => {
  const d = body(req.body);
  d.slug = await uniqueSlug(Post, req.body.slug || d.title);
  res.status(201).json(await Post.create(d));
}));
r.put('/:id', adminOnly, asyncH(async (req, res) => {
  const d = body(req.body);
  if (req.body.slug || req.body.title) d.slug = await uniqueSlug(Post, req.body.slug || req.body.title, req.params.id);
  res.json(await Post.findByIdAndUpdate(req.params.id, d, { new: true }));
}));
r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
