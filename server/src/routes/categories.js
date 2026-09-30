import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { uniqueSlug } from '../utils/slug.js';

const r = Router();
const FIELDS = ['name', 'description', 'link', 'image', 'banner', 'order', 'active', 'showOnHome', 'showInFilters'];
const body = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

r.get('/', asyncH(async (req, res) => {
  const filter = req.query.all ? {} : { active: true };
  const cats = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(cats.map((c) => ({ ...c, productCount: map[String(c._id)] || 0 })));
}));

r.get('/:slug', asyncH(async (req, res) => {
  const c = await Category.findOne({ slug: req.params.slug }).lean();
  if (!c) return res.status(404).json({ message: 'Category not found' });
  res.json(c);
}));

r.post('/', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  data.slug = await uniqueSlug(Category, req.body.slug || data.name);
  res.status(201).json(await Category.create(data));
}));

r.put('/reorder', adminOnly, asyncH(async (req, res) => {
  await Promise.all((req.body.ids || []).map((id, i) => Category.findByIdAndUpdate(id, { order: i })));
  res.json({ ok: true });
}));

r.put('/:id', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  if (req.body.slug || req.body.name) data.slug = await uniqueSlug(Category, req.body.slug || req.body.name, req.params.id);
  const c = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!c) return res.status(404).json({ message: 'Category not found' });
  res.json(c);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  const n = await Product.countDocuments({ category: req.params.id });
  if (n) return res.status(400).json({ message: `Move or delete the ${n} product(s) in this category first` });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
