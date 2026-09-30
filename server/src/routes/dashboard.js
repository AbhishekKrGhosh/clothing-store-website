import { Router } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Subscriber from '../models/Subscriber.js';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { getSingleton } from '../utils/singletons.js';

const r = Router();
r.use(adminOnly);

const DAY = 86400000;
const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur ? 100 : 0);
const valid = { status: { $ne: 'Cancelled' } };

async function periodStats(from, to) {
  const [o] = await Order.aggregate([
    { $match: { ...valid, createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  const customers = await User.countDocuments({ role: 'customer', createdAt: { $gte: from, $lt: to } });
  const [rv] = await Review.aggregate([
    { $match: { approved: true, createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  return { revenue: o?.revenue || 0, orders: o?.orders || 0, customers, rating: rv?.avg || 0 };
}

r.get('/', asyncH(async (req, res) => {
  const days = Math.min(365, +req.query.days || 30);
  const now = new Date();
  const from = new Date(now - days * DAY);
  const prevFrom = new Date(now - 2 * days * DAY);
  const [cur, prev] = await Promise.all([periodStats(from, now), periodStats(prevFrom, from)]);

  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const [allRating] = await Review.aggregate([{ $match: { approved: true } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]);
  const productRating = await Product.aggregate([{ $match: { numReviews: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]);
  const avgRating = allRating?.avg || productRating[0]?.avg || 0;

  // Monthly sales for the last N months
  const months = Math.min(24, +req.query.months || 6);
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const monthly = await Order.aggregate([
    { $match: { ...valid, createdAt: { $gte: start } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  const salesOverview = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const hit = monthly.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    salesOverview.push({ label: d.toLocaleString('en', { month: 'short' }), revenue: hit?.revenue || 0, orders: hit?.orders || 0 });
  }

  const statusAgg = await Order.aggregate([{ $match: { createdAt: { $gte: from } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const statusCounts = Object.fromEntries(['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => [s, statusAgg.find((x) => x._id === s)?.n || 0]));

  const top = await Order.aggregate([
    { $match: { ...valid, createdAt: { $gte: from } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
    { $sort: { qty: -1 } },
    { $limit: 5 },
  ]);
  let topProducts = top;
  if (!topProducts.length) {
    const ps = await Product.find().sort({ sold: -1 }).limit(5).lean();
    topProducts = ps.map((p) => ({ _id: p._id, name: p.name, image: p.images?.[0], qty: p.sold, revenue: p.sold * p.price }));
  }

  const settings = await getSingleton('settings');
  const threshold = settings.commerce.lowStockThreshold || 5;
  const lowStock = await Product.aggregate([
    { $addFields: { stock: { $sum: '$sizes.stock' } } },
    { $match: { stock: { $lte: threshold } } },
    { $project: { name: 1, stock: 1, image: { $arrayElemAt: ['$images', 0] }, sizes: 1 } },
    { $limit: 6 },
  ]);

  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).select('orderNumber customer total status createdAt items').lean();

  res.json({
    cards: {
      revenue: { value: cur.revenue, change: pct(cur.revenue, prev.revenue) },
      orders: { value: cur.orders, change: pct(cur.orders, prev.orders) },
      customers: { value: totalCustomers, change: pct(cur.customers, prev.customers) },
      rating: { value: Math.round(avgRating * 10) / 10, change: Math.round((cur.rating - prev.rating) * 10) / 10 },
    },
    salesOverview,
    statusCounts,
    totalOrdersInRange: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    topProducts,
    lowStock,
    recentOrders,
    pendingReviews: await Review.countDocuments({ approved: false }),
  });
}));

r.get('/analytics', asyncH(async (req, res) => {
  const days = Math.min(365, +req.query.days || 30);
  const from = new Date(Date.now() - days * DAY);
  const match = { ...valid, createdAt: { $gte: from } };

  const daily = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    const hit = daily.find((x) => x._id === d);
    series.push({ date: d, revenue: hit?.revenue || 0, orders: hit?.orders || 0 });
  }

  const byCategory = await Order.aggregate([
    { $match: match }, { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
    { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
    { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
    { $group: { _id: { $ifNull: ['$c.name', 'Uncategorised'] }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }, qty: { $sum: '$items.qty' } } },
    { $sort: { revenue: -1 } },
  ]);
  const byGender = await Order.aggregate([
    { $match: match }, { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
    { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
    { $group: { _id: { $ifNull: ['$p.gender', 'Other'] }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
    { $sort: { revenue: -1 } },
  ]);
  const topCustomers = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$customer.email', name: { $first: '$customer.name' }, orders: { $sum: 1 }, spent: { $sum: '$total' } } },
    { $sort: { spent: -1 } }, { $limit: 6 },
  ]);
  const coupons = await Order.aggregate([
    { $match: { ...match, couponCode: { $nin: [null, ''] } } },
    { $group: { _id: '$couponCode', uses: { $sum: 1 }, discount: { $sum: '$discount' } } },
    { $sort: { uses: -1 } },
  ]);
  const [totals] = await Order.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, items: { $sum: { $sum: '$items.qty' } }, discount: { $sum: '$discount' } } }]);
  const cancelled = await Order.countDocuments({ status: 'Cancelled', createdAt: { $gte: from } });

  res.json({
    series, byCategory, byGender, topCustomers, coupons,
    totals: {
      revenue: totals?.revenue || 0,
      orders: totals?.orders || 0,
      itemsSold: totals?.items || 0,
      discount: totals?.discount || 0,
      aov: totals?.orders ? Math.round(totals.revenue / totals.orders) : 0,
      cancelled,
      subscribers: await Subscriber.countDocuments(),
      products: await Product.countDocuments({ active: true }),
    },
  });
}));

export default r;
