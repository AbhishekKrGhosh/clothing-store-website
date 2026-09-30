import { Router } from 'express';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { uniqueSlug } from '../utils/slug.js';

const r = Router();
const FIELDS = ['name', 'description', 'logo', 'order', 'active'];
const body = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

r.get('/', asyncH(async (req, res) => {
  const brands = await Brand.find(req.query.all ? {} : { active: true }).sort({ order: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: '$brand', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(brands.map((b) => ({ ...b, productCount: map[String(b._id)] || 0 })));
}));

r.post('/', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  data.slug = await uniqueSlug(Brand, req.body.slug || data.name);
  res.status(201).json(await Brand.create(data));
}));

r.put('/:id', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  if (req.body.slug || req.body.name) data.slug = await uniqueSlug(Brand, req.body.slug || req.body.name, req.params.id);
  const b = await Brand.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!b) return res.status(404).json({ message: 'Brand not found' });
  res.json(b);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Product.updateMany({ brand: req.params.id }, { $unset: { brand: 1 } });
  await Brand.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
