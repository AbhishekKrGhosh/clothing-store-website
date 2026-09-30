import { Router } from 'express';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js';
import { getSingleton } from '../utils/singletons.js';
import { escapeRegex } from '../utils/pick.js';

const r = Router();

async function restock(order) {
  for (const it of order.items) {
    // eslint-disable-next-line no-await-in-loop
    await Product.updateOne(
      { _id: it.product, 'sizes.label': it.size },
      { $inc: { 'sizes.$.stock': it.qty, sold: -it.qty } }
    );
  }
}

// Price a cart on the server (used by checkout preview and order creation)
async function priceCart(items, couponCode) {
  const settings = await getSingleton('settings');
  const { freeShippingThreshold, shippingFee, taxPercent } = settings.commerce;
  if (!Array.isArray(items) || !items.length) throw Object.assign(new Error('Your cart is empty'), { status: 400 });

  const lines = [];
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    const p = await Product.findOne({ _id: it.product, active: true }).lean();
    if (!p) throw Object.assign(new Error('A product in your cart is no longer available'), { status: 400 });
    const qty = Math.max(1, Math.min(20, parseInt(it.qty, 10) || 1));
    if (p.sizes?.length) {
      const s = p.sizes.find((x) => x.label === it.size);
      if (!s) throw Object.assign(new Error(`Please choose a size for ${p.name}`), { status: 400 });
      if (s.stock < qty) throw Object.assign(new Error(`Only ${s.stock} left of ${p.name} (${it.size})`), { status: 400 });
    }
    const color = p.colors?.find((c) => c.name === it.color);
    lines.push({
      product: p._id, name: p.name, slug: p.slug,
      image: color?.images?.[0] || p.images?.[0],
      price: p.price, color: it.color || '', size: it.size || '', qty,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    if (!coupon) throw Object.assign(new Error('Invalid coupon code'), { status: 400 });
    const ev = coupon.evaluate(subtotal);
    if (!ev.ok) throw Object.assign(new Error(ev.message), { status: 400 });
    discount = ev.discount;
  }
  const afterDiscount = subtotal - discount;
  const shipping = freeShippingThreshold && subtotal >= freeShippingThreshold ? 0 : shippingFee || 0;
  const tax = Math.round((afterDiscount * (taxPercent || 0)) / 100);
  return { lines, subtotal, discount, coupon, shipping, tax, total: afterDiscount + shipping + tax, settings };
}

r.post('/quote', asyncH(async (req, res) => {
  const { lines, subtotal, discount, shipping, tax, total, coupon } = await priceCart(req.body.items, req.body.couponCode);
  res.json({ items: lines, subtotal, discount, shipping, tax, total, couponCode: coupon?.code });
}));

r.post('/', optionalAuth, asyncH(async (req, res) => {
  const { items, customer = {}, shippingAddress = {}, couponCode, notes } = req.body;
  if (!customer.name || !customer.email || !customer.phone) return res.status(400).json({ message: 'Please fill in your name, email and phone' });
  if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.pincode) return res.status(400).json({ message: 'Please complete your shipping address' });

  const q = await priceCart(items, couponCode);
  if (!q.settings.commerce.codEnabled) return res.status(400).json({ message: 'Cash on delivery is currently unavailable' });

  // Reserve stock atomically; roll back on failure
  const done = [];
  for (const l of q.lines) {
    const prod = await Product.findById(l.product, { sizes: 1 }).lean(); // eslint-disable-line no-await-in-loop
    if (!prod.sizes?.length) {
      await Product.updateOne({ _id: l.product }, { $inc: { sold: l.qty } }); // eslint-disable-line no-await-in-loop
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const ok = await Product.updateOne(
      { _id: l.product, sizes: { $elemMatch: { label: l.size, stock: { $gte: l.qty } } } },
      { $inc: { 'sizes.$.stock': -l.qty, sold: l.qty } }
    );
    if (!ok.modifiedCount) {
      await restock({ items: done }); // eslint-disable-line no-await-in-loop
      return res.status(400).json({ message: `${l.name} (${l.size}) just sold out` });
    }
    done.push(l);
  }

  const order = await Order.create({
    user: req.user?._id,
    customer: { name: customer.name, email: String(customer.email).toLowerCase(), phone: customer.phone },
    shippingAddress,
    items: q.lines,
    subtotal: q.subtotal, discount: q.discount, couponCode: q.coupon?.code, shipping: q.shipping, tax: q.tax, total: q.total,
    paymentMethod: 'COD',
    notes,
    statusHistory: [{ status: 'Pending', note: 'Order placed' }],
  });
  if (q.coupon) await Coupon.updateOne({ _id: q.coupon._id }, { $inc: { used: 1 } });
  if (req.user && !req.user.addresses?.length) {
    req.user.addresses = [{ ...shippingAddress, name: customer.name, phone: customer.phone }];
    if (!req.user.phone) req.user.phone = customer.phone;
    await req.user.save();
  }
  res.status(201).json(order);
}));

r.get('/mine', protect, asyncH(async (req, res) => {
  res.json(await Order.find({ $or: [{ user: req.user._id }, { 'customer.email': req.user.email }] }).sort({ createdAt: -1 }).lean());
}));

r.get('/track', asyncH(async (req, res) => {
  const { orderNumber, email } = req.query;
  const o = await Order.findOne({ orderNumber: String(orderNumber || '').toUpperCase().trim(), 'customer.email': String(email || '').toLowerCase().trim() }).lean();
  if (!o) return res.status(404).json({ message: 'No order found with those details' });
  res.json(o);
}));

r.post('/:id/cancel', protect, asyncH(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o || (String(o.user) !== String(req.user._id) && o.customer.email !== req.user.email)) return res.status(404).json({ message: 'Order not found' });
  if (!['Pending', 'Confirmed'].includes(o.status)) return res.status(400).json({ message: 'This order can no longer be cancelled' });
  o.status = 'Cancelled';
  o.statusHistory.push({ status: 'Cancelled', note: 'Cancelled by customer' });
  await o.save();
  await restock(o);
  res.json(o);
}));

// ---------- Admin ----------
r.get('/', adminOnly, asyncH(async (req, res) => {
  const f = {};
  if (req.query.status && ORDER_STATUSES.includes(req.query.status)) f.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    f.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.email': rx }, { 'customer.phone': rx }];
  }
  if (req.query.from || req.query.to) {
    f.createdAt = {};
    if (req.query.from) f.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) f.createdAt.$lte = new Date(`${req.query.to}T23:59:59`);
  }
  if (req.query.user) f.user = req.query.user;
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(100, +req.query.limit || 20);
  const [items, total, counts] = await Promise.all([
    Order.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(f),
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
}));

r.get('/:id', protect, asyncH(async (req, res) => {
  const o = await Order.findById(req.params.id).populate('user', 'name email phone').lean();
  if (!o) return res.status(404).json({ message: 'Order not found' });
  const isOwner = String(o.user?._id) === String(req.user._id) || o.customer.email === req.user.email;
  if (req.user.role !== 'admin' && !isOwner) return res.status(404).json({ message: 'Order not found' });
  res.json(o);
}));

r.patch('/:id', adminOnly, asyncH(async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) return res.status(404).json({ message: 'Order not found' });
  const { status, note, paymentStatus, trackingNumber, notes } = req.body;
  if (status && status !== o.status) {
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if (status === 'Cancelled') await restock(o);
    o.status = status;
    o.statusHistory.push({ status, note: note || '' });
    if (status === 'Delivered' && o.paymentStatus === 'Pending') o.paymentStatus = 'Paid';
  }
  if (paymentStatus) o.paymentStatus = paymentStatus;
  if (trackingNumber !== undefined) o.trackingNumber = trackingNumber;
  if (notes !== undefined) o.notes = notes;
  await o.save();
  res.json(o);
}));

r.delete('/:id', adminOnly, asyncH(async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
