import { Router } from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { escapeRegex } from '../utils/pick.js';

const r = Router();
r.use(adminOnly);

r.get('/', asyncH(async (req, res) => {
  const f = { role: req.query.role || 'customer' };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    f.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const [users, total] = await Promise.all([
    User.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(f),
  ]);
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, last: { $max: '$createdAt' } } },
  ]);
  const map = Object.fromEntries(stats.map((s) => [String(s._id), s]));
  res.json({
    items: users.map((u) => ({ ...u, orders: map[String(u._id)]?.orders || 0, spent: map[String(u._id)]?.spent || 0, lastOrder: map[String(u._id)]?.last })),
    total, page, pages: Math.ceil(total / limit) || 1,
  });
}));

r.get('/:id', asyncH(async (req, res) => {
  const u = await User.findById(req.params.id).lean();
  if (!u) return res.status(404).json({ message: 'Customer not found' });
  const orders = await Order.find({ $or: [{ user: u._id }, { 'customer.email': u.email }] }).sort({ createdAt: -1 }).lean();
  res.json({ ...u, orderList: orders });
}));

r.post('/', asyncH(async (req, res) => {
  const { name, email, password, role = 'customer', phone } = req.body;
  const u = await User.create({ name, email, password, role, phone });
  res.status(201).json({ _id: u._id, name: u.name, email: u.email, role: u.role });
}));

r.patch('/:id', asyncH(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  ['name', 'phone', 'active', 'role'].forEach((k) => req.body[k] !== undefined && (u[k] = req.body[k]));
  if (String(u._id) === String(req.user._id) && (u.role !== 'admin' || !u.active)) return res.status(400).json({ message: 'You cannot demote or disable yourself' });
  if (req.body.password) u.password = req.body.password;
  await u.save();
  res.json({ ok: true });
}));

r.delete('/:id', asyncH(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete yourself' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
