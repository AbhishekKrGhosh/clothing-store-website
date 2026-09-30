import { Router } from 'express';
import Coupon from '../models/Coupon.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';

const r = Router();
const FIELDS = ['code', 'description', 'type', 'value', 'minOrder', 'maxDiscount', 'usageLimit', 'startsAt', 'expiresAt', 'active', 'showOnSite'];
const body = (b) => {
  const d = Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
  ['startsAt', 'expiresAt'].forEach((k) => d[k] === '' && (d[k] = null));
  return d;
};

r.post('/validate', asyncH(async (req, res) => {
  const c = await Coupon.findOne({ code: String(req.body.code || '').toUpperCase().trim() });
  if (!c) return res.status(404).json({ message: 'Invalid coupon code' });
  const result = c.evaluate(+req.body.subtotal || 0);
  if (!result.ok) return res.status(400).json({ message: result.message });
  res.json({ code: c.code, discount: result.discount, description: c.description, type: c.type, value: c.value });
}));

r.get('/', adminOnly, asyncH(async (_req, res) => res.json(await Coupon.find().sort({ createdAt: -1 }))));
r.post('/', adminOnly, asyncH(async (req, res) => res.status(201).json(await Coupon.create(body(req.body)))));
r.put('/:id', adminOnly, asyncH(async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, body(req.body), { new: true, runValidators: true });
  if (!c) return res.status(404).json({ message: 'Coupon not found' });
  res.json(c);
}));
r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
