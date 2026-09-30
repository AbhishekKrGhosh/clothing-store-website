import { Router } from 'express';
import Subscriber from '../models/Subscriber.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';

const r = Router();

r.post('/', asyncH(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email' });
  await Subscriber.updateOne({ email }, { email }, { upsert: true });
  res.status(201).json({ ok: true });
}));

r.get('/', adminOnly, asyncH(async (req, res) => {
  const items = await Subscriber.find().sort({ createdAt: -1 }).lean();
  if (req.query.format === 'csv') {
    res.type('text/csv').attachment('subscribers.csv');
    return res.send(['email,subscribed_at', ...items.map((i) => `${i.email},${i.createdAt.toISOString()}`)].join('\n'));
  }
  res.json(items);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Subscriber.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
