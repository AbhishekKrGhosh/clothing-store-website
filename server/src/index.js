import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { ensureAdmin, seedIfEmpty } from './seed/seed.js';

import authRoutes from './routes/auth.js';
import imageRoutes from './routes/images.js';
import siteRoutes from './routes/settings.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import productRoutes from './routes/products.js';
import reviewRoutes from './routes/reviews.js';
import couponRoutes from './routes/coupons.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import subscriberRoutes from './routes/subscribers.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const origins = (process.env.CLIENT_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: (o, cb) => cb(null, !o || !origins.length || origins.includes(o)), credentials: true }));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev', { skip: (req) => req.url.startsWith('/api/images/') }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', notFound);

// Optional: serve production builds (npm run build in client/ and admin/)
const adminDist = path.resolve(__dirname, '../../admin/dist');
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist, { maxAge: '7d', index: false }));
  app.get('/admin/*', (_req, res) => res.sendFile(path.join(adminDist, 'index.html')));
}
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    await ensureAdmin();
    if (process.env.AUTO_SEED !== 'false') await seedIfEmpty();
    app.listen(PORT, () => console.log(`✔ API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('✖ Failed to start:', e.message);
    process.exit(1);
  });
