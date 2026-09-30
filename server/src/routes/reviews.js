import { Router } from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly, optionalAuth } from '../middleware/auth.js';
import { getSingleton } from '../utils/singletons.js';

const r = Router();

r.get('/product/:id', asyncH(async (req, res) => {
  const items = await Review.find({ product: req.params.id, approved: true }).sort({ createdAt: -1 }).limit(50).select('-email').lean();
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, count: items.filter((i) => i.rating === s).length }));
  res.json({ items, distribution: dist });
}));

r.post('/', optionalAuth, asyncH(async (req, res) => {
  const { product, rating, title, comment } = req.body;
  const name = req.user?.name || req.body.name;
  if (!product || !rating || !name) return res.status(400).json({ message: 'Name, rating and product are required' });
  if (!(await Product.exists({ _id: product }))) return res.status(404).json({ message: 'Product not found' });
  const settings = await getSingleton('settings');
  const review = await Review.create({
    product, rating: Math.min(5, Math.max(1, +rating)), title, comment, name,
    email: req.user?.email || req.body.email, user: req.user?._id,
    approved: !!settings.commerce.autoApproveReviews,
  });
  if (review.approved) await Review.recalc(product);
  res.status(201).json({ review, message: review.approved ? 'Thanks for your review!' : 'Thanks! Your review will appear once approved.' });
}));

r.get('/', adminOnly, asyncH(async (req, res) => {
  const f = {};
  if (req.query.status === 'pending') f.approved = false;
  if (req.query.status === 'approved') f.approved = true;
  if (req.query.rating) f.rating = +req.query.rating;
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const [items, total, pending] = await Promise.all([
    Review.find(f).populate('product', 'name slug images').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(f),
    Review.countDocuments({ approved: false }),
  ]);
  res.json({
    items: items.map((i) => ({ ...i, product: i.product && { ...i.product, images: (i.product.images || []).slice(0, 1) } })),
    total, page, pages: Math.ceil(total / limit) || 1, pending,
  });
}));

r.patch('/:id', adminOnly, asyncH(async (req, res) => {
  const rv = await Review.findById(req.params.id);
  if (!rv) return res.status(404).json({ message: 'Review not found' });
  ['approved', 'title', 'comment', 'rating', 'name'].forEach((k) => req.body[k] !== undefined && (rv[k] = req.body[k]));
  await rv.save();
  await Review.recalc(rv.product);
  res.json(rv);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  const rv = await Review.findByIdAndDelete(req.params.id);
  if (rv) await Review.recalc(rv.product);
  res.json({ ok: true });
}));

export default r;
