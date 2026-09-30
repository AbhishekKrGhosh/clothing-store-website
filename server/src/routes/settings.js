import { Router } from 'express';
import { asyncH } from '../middleware/error.js';
import { adminOnly } from '../middleware/auth.js';
import { getSingleton, setSingleton } from '../utils/singletons.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Coupon from '../models/Coupon.js';

const r = Router();

// One call to boot the storefront: settings + content + categories + brands
r.get('/bootstrap', asyncH(async (_req, res) => {
  const [settings, content, categories, brands, offers] = await Promise.all([
    getSingleton('settings'),
    getSingleton('content'),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Brand.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Coupon.find({ active: true, showOnSite: true }).select('code description type value minOrder expiresAt').lean(),
  ]);
  res.set('Cache-Control', 'no-cache');
  res.json({ settings, content, categories, brands, offers });
}));

r.get('/settings', asyncH(async (_req, res) => res.json(await getSingleton('settings'))));
r.put('/settings', adminOnly, asyncH(async (req, res) => res.json(await setSingleton('settings', req.body))));

r.get('/content', asyncH(async (_req, res) => res.json(await getSingleton('content'))));
r.put('/content', adminOnly, asyncH(async (req, res) => res.json(await setSingleton('content', req.body))));

export default r;
