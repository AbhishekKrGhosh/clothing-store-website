import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Review from '../models/Review.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { uniqueSlug } from '../utils/slug.js';
import { escapeRegex } from '../utils/pick.js';

const r = Router();
const FIELDS = [
  'name', 'sku', 'shortDescription', 'description', 'highlights', 'fabric', 'care', 'category', 'brand', 'gender',
  'price', 'comparePrice', 'images', 'colors', 'sizes', 'tags', 'featured', 'newArrival', 'bestSeller', 'active', 'order',
];
const body = (b) => {
  const d = Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
  if (d.category === '') d.category = null;
  if (d.brand === '') d.brand = null;
  return d;
};
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

async function buildFilter(q, isAdmin) {
  const f = {};
  if (!(isAdmin && q.all)) f.active = true;
  if (isAdmin && q.status === 'inactive') f.active = false;
  if (isAdmin && q.status === 'active') f.active = true;

  if (q.category) {
    const vals = list(q.category);
    const ids = vals.filter((v) => mongoose.isValidObjectId(v));
    const slugs = vals.filter((v) => !mongoose.isValidObjectId(v));
    const cats = slugs.length ? await Category.find({ slug: { $in: slugs } }, { _id: 1 }).lean() : [];
    f.category = { $in: [...ids, ...cats.map((c) => c._id)] };
  }
  if (q.brand) {
    const vals = list(q.brand);
    const ids = vals.filter((v) => mongoose.isValidObjectId(v));
    const slugs = vals.filter((v) => !mongoose.isValidObjectId(v));
    const brands = slugs.length ? await Brand.find({ slug: { $in: slugs } }, { _id: 1 }).lean() : [];
    f.brand = { $in: [...ids, ...brands.map((c) => c._id)] };
  }
  if (q.gender) {
    const g = list(q.gender);
    f.gender = { $in: g.includes('Men') || g.includes('Women') ? [...g, 'Unisex'] : g };
  }
  if (q.size) f['sizes.label'] = { $in: list(q.size) };
  if (q.color) f['colors.name'] = { $in: list(q.color).map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) };
  if (q.minPrice || q.maxPrice) {
    f.price = {};
    if (q.minPrice) f.price.$gte = +q.minPrice;
    if (q.maxPrice) f.price.$lte = +q.maxPrice;
  }
  if (q.featured === 'true') f.featured = true;
  if (q.newArrival === 'true') f.newArrival = true;
  if (q.bestSeller === 'true') f.bestSeller = true;
  if (q.ids) f._id = { $in: list(q.ids).filter((v) => mongoose.isValidObjectId(v)) };
  if (q.exclude && mongoose.isValidObjectId(q.exclude)) f._id = { ...(f._id || {}), $ne: q.exclude };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.trim()), 'i');
    const cats = await Category.find({ name: rx }, { _id: 1 }).lean();
    f.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }, { sku: rx }, { category: { $in: cats.map((c) => c._id) } }];
  }
  if (isAdmin && q.stock === 'low') f.$expr = { $lte: [{ $sum: '$sizes.stock' }, +(q.threshold || 5)] };
  if (isAdmin && q.stock === 'out') f.$expr = { $eq: [{ $sum: '$sizes.stock' }, 0] };
  return f;
}

const SORTS = {
  new: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { sold: -1, rating: -1 },
  rating: { rating: -1, numReviews: -1 },
  name: { name: 1 },
  default: { order: 1, createdAt: -1 },
};

r.get('/', optionalAuth, asyncH(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const filter = await buildFilter(req.query, isAdmin);
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, Math.max(1, +req.query.limit || 12));
  const sort = SORTS[req.query.sort] || SORTS.default;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('-description -highlights -care -fabric')
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  let out = items.map((p) => p.toJSON());
  if (req.query.ids && req.query.keepOrder) {
    const order = list(req.query.ids);
    out.sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)));
  }
  if (!isAdmin) out = out.map((p) => ({ ...p, images: p.images.slice(0, 2), colors: p.colors.map(({ name, hex }) => ({ name, hex })) }));
  res.json({ items: out, total, page, pages: Math.ceil(total / limit) || 1 });
}));

r.get('/filters', asyncH(async (_req, res) => {
  const [colors, sizes, price] = await Promise.all([
    Product.aggregate([{ $match: { active: true } }, { $unwind: '$colors' }, { $group: { _id: { $toLower: '$colors.name' }, name: { $first: '$colors.name' }, hex: { $first: '$colors.hex' } } }, { $sort: { name: 1 } }]),
    Product.distinct('sizes.label', { active: true }),
    Product.aggregate([{ $match: { active: true } }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
  ]);
  const ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
  sizes.sort((a, b) => {
    const ia = ORDER.indexOf(a); const ib = ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return String(a).localeCompare(String(b), undefined, { numeric: true });
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  res.json({ colors: colors.map((c) => ({ name: c.name, hex: c.hex })), sizes, price: price[0] || { min: 0, max: 0 } });
}));

r.get('/:idOrSlug', optionalAuth, asyncH(async (req, res) => {
  const key = req.params.idOrSlug;
  const q = mongoose.isValidObjectId(key) ? { _id: key } : { slug: key };
  if (req.user?.role !== 'admin') q.active = true;
  const p = await Product.findOne(q).populate('category', 'name slug').populate('brand', 'name slug logo');
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
}));

r.get('/:id/related', asyncH(async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.json([]);
  const limit = Math.min(12, +req.query.limit || 4);
  const sel = '-description -highlights -care -fabric';
  let items = await Product.find({ active: true, _id: { $ne: p._id }, category: p.category }).select(sel).sort({ sold: -1 }).limit(limit).lean({ virtuals: true });
  if (items.length < limit) {
    const more = await Product.find({ active: true, _id: { $nin: [p._id, ...items.map((i) => i._id)] }, gender: { $in: [p.gender, 'Unisex'] } })
      .select(sel).sort({ featured: -1, sold: -1 }).limit(limit - items.length).lean();
    items = items.concat(more);
  }
  res.json(items.map((x) => ({ ...x, images: (x.images || []).slice(0, 2), colors: (x.colors || []).map(({ name, hex }) => ({ name, hex })) })));
}));

r.post('/', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  data.slug = await uniqueSlug(Product, req.body.slug || data.name);
  res.status(201).json(await Product.create(data));
}));

r.post('/bulk', adminOnly, asyncH(async (req, res) => {
  const { ids = [], action } = req.body;
  const map = {
    activate: { active: true }, deactivate: { active: false },
    feature: { featured: true }, unfeature: { featured: false },
    markNew: { newArrival: true }, unmarkNew: { newArrival: false },
  };
  if (action === 'delete') {
    await Product.deleteMany({ _id: { $in: ids } });
    await Review.deleteMany({ product: { $in: ids } });
  } else if (map[action]) await Product.updateMany({ _id: { $in: ids } }, map[action]);
  else return res.status(400).json({ message: 'Unknown action' });
  res.json({ ok: true });
}));

r.post('/:id/duplicate', adminOnly, asyncH(async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.status(404).json({ message: 'Product not found' });
  const { _id, createdAt, updatedAt, rating, numReviews, sold, ...rest } = p;
  const copy = await Product.create({ ...rest, name: `${p.name} (Copy)`, slug: await uniqueSlug(Product, `${p.name} copy`), active: false });
  res.status(201).json(copy);
}));

r.put('/:id', adminOnly, asyncH(async (req, res) => {
  const data = body(req.body);
  if (req.body.slug !== undefined || req.body.name) data.slug = await uniqueSlug(Product, req.body.slug || req.body.name, req.params.id);
  const p = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
}));

// Quick partial updates (toggles, inventory)
r.patch('/:id', adminOnly, asyncH(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, body(req.body), { new: true, runValidators: true });
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ product: req.params.id });
  res.json({ ok: true });
}));

export default r;
