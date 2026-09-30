/* Seeds the database with the AARO demo store (content, categories, brands, products, lookbook, journal…).
 * Usage:  npm run seed          → seeds only if the store is empty
 *         npm run seed:fresh    → wipes store data (keeps users) and re-seeds
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Post from '../models/Post.js';
import Image from '../models/Image.js';
import Singleton from '../models/Singleton.js';
import Subscriber from '../models/Subscriber.js';
import { processImage } from '../utils/image.js';
import { slugify } from '../utils/slug.js';
import { defaultSettings, defaultContent, deepMerge } from '../utils/defaults.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../../seed/images');

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const exists = await User.findOne({ email });
  if (!exists) {
    await User.create({ name: 'Admin', email, password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' });
    console.log(`✔ Admin created → ${email}`);
  }
}

const cache = {};
async function img(file, preset = 'product', alt = '') {
  const key = `${file}:${preset}`;
  if (!cache[key]) {
    const p = path.join(IMG_DIR, `${file}.jpg`);
    if (!fs.existsSync(p)) return null;
    cache[key] = await processImage(fs.readFileSync(p), preset, `${file}.jpg`);
  }
  return { ...cache[key], alt };
}

const C = {
  olive: { name: 'Olive Green', hex: '#556042' },
  beige: { name: 'Beige', hex: '#D8C7AB' },
  navy: { name: 'Navy', hex: '#1F2A44' },
  black: { name: 'Black', hex: '#1E1D1B' },
  khaki: { name: 'Khaki', hex: '#9A8058' },
  white: { name: 'Off White', hex: '#F1ECE2' },
  ivory: { name: 'Ivory', hex: '#EDE3D1' },
  rust: { name: 'Terracotta', hex: '#A9502E' },
  sage: { name: 'Sage', hex: '#8E9C7A' },
  tan: { name: 'Tan', hex: '#B38B5D' },
};
const APPAREL = (n = 12) => ['S', 'M', 'L', 'XL'].map((label, i) => ({ label, stock: n + ((i * 7) % 9) }));
const WAIST = (n = 8) => ['28', '30', '32', '34', '36'].map((label, i) => ({ label, stock: n + ((i * 5) % 7) }));
const WOMEN = (n = 10) => ['XS', 'S', 'M', 'L', 'XL'].map((label, i) => ({ label, stock: n + ((i * 3) % 6) }));

export async function seedStore({ demoOrders = true } = {}) {
  console.log('… Seeding demo store (processing images)');

  // ---------- Settings & content ----------
  const settings = deepMerge(defaultSettings, {});
  const content = deepMerge(defaultContent, {});
  content.home.hero.image = await img('hero', 'hero', 'AARO — everyday clothing');
  content.home.sustainability.image = await img('sustain', 'banner', 'Natural linen fabric with AARO tag');
  content.home.newsletter.image = await img('look2', 'banner', 'Woman in a garden');
  content.collections.image = await img('collections-hero', 'banner', 'Our collections');
  content.about.image = await img('look4', 'hero', 'AARO story');
  content.about.blocks[0].image = await img('sustain', 'banner');
  content.about.blocks[1].image = await img('look3', 'lookbook');
  content.lookbook.items = [
    { image: await img('look1', 'lookbook', 'Linen overshirt in a sunlit courtyard'), caption: 'Morning light, linen layers', link: '/product/linen-overshirt' },
    { image: await img('look2', 'lookbook', 'Terracotta dress in the garden'), caption: 'Garden walks in terracotta', link: '/product/flowy-dress' },
    { image: await img('look3', 'lookbook', 'Olive utility set'), caption: 'Olive, easy and unhurried', link: '/product/utility-cargo-trousers' },
    { image: await img('look4', 'lookbook', 'Flowing scarf'), caption: 'Handwoven, made to move', link: '/product/handwoven-scarf' },
  ];
  await Singleton.findOneAndUpdate({ key: 'settings' }, { value: settings }, { upsert: true });
  await Singleton.findOneAndUpdate({ key: 'content' }, { value: content }, { upsert: true });

  // ---------- Brands ----------
  const brandDefs = [
    { name: 'AARO Essentials', description: 'Everyday staples in organic cotton and linen.' },
    { name: 'AARO Studio', description: 'Considered silhouettes for work and weekend.' },
    { name: 'AARO Handloom', description: 'Handwoven pieces made with artisan clusters across India.' },
  ];
  const brands = {};
  for (const [i, b] of brandDefs.entries()) brands[b.name] = await Brand.create({ ...b, slug: slugify(b.name), order: i });

  // ---------- Categories ----------
  const catDefs = [
    { name: 'New Arrivals', image: 'cat-new-arrivals', link: '/shop?newArrival=true', description: 'Fresh drops, made in small batches.' },
    { name: 'Shirts', image: 'cat-shirts', description: 'Breathable linen and cotton shirts.' },
    { name: 'T-Shirts', image: 'cat-tshirts', description: 'Soft organic cotton tees.' },
    { name: 'Trousers', image: 'cat-trousers', description: 'Relaxed, straight and cargo fits.' },
    { name: 'Ethnic Wear', image: 'cat-ethnic', description: 'Kurtas and more in natural fabrics.' },
    { name: 'Women', image: 'cat-women', link: '/shop?gender=Women', description: 'Dresses, kurtas and easy layers.' },
    { name: 'Dresses', image: 'p-flowy-dress', showOnHome: false, description: 'Flowing, breathable dresses.' },
    { name: 'Shorts', image: 'p-linen-shorts', showOnHome: false, description: 'Linen shorts for warm days.' },
    { name: 'Accessories', image: 'p-scarf', showOnHome: false, description: 'Handwoven scarves and finishing touches.' },
  ];
  const cats = {};
  for (const [i, c] of catDefs.entries()) {
    cats[c.name] = await Category.create({
      name: c.name, slug: slugify(c.name), description: c.description, link: c.link || '',
      image: await img(c.image, 'category', c.name), order: i, showOnHome: c.showOnHome !== false,
      showInFilters: !c.link,
    });
  }

  // ---------- Products ----------
  const P = [
    {
      name: 'Linen Overshirt', cat: 'Shirts', brand: 'AARO Studio', gender: 'Men', price: 2499, comparePrice: 2999,
      images: ['pd-main', 'p-linen-overshirt', 'look1'],
      colors: [[C.olive, ['pd-main', 'look1']], [C.beige, ['p-linen-overshirt']], [C.navy], [C.black]],
      sizes: APPAREL(14), featured: true, bestSeller: true, rating: 4.6, numReviews: 132, sold: 42,
      short: 'A lightweight linen overshirt designed for everyday comfort. Breathable, versatile and perfect for layering across seasons.',
      highlights: ['100% European flax linen', 'Relaxed fit with dropped shoulders', 'Coconut-shell buttons', 'Two patch pockets'],
      fabric: '100% Linen, 180 GSM', tags: ['linen', 'overshirt', 'layering'],
    },
    {
      name: 'Relaxed Fit T-Shirt', cat: 'T-Shirts', brand: 'AARO Essentials', gender: 'Unisex', price: 1299,
      images: ['p-relaxed-tee', 'p-oversized-tee'], colors: [[C.beige, ['p-relaxed-tee']], [C.black], [C.olive]],
      sizes: APPAREL(20), featured: true, bestSeller: true, rating: 4.5, numReviews: 88, sold: 38,
      short: 'Our everyday tee in heavyweight organic cotton — soft, structured and made to last.',
      highlights: ['GOTS-certified organic cotton', '220 GSM jersey', 'Relaxed unisex fit'], fabric: '100% Organic Cotton', tags: ['tee', 'organic cotton'],
    },
    {
      name: 'Straight Fit Trousers', cat: 'Trousers', brand: 'AARO Studio', gender: 'Men', price: 2199,
      images: ['p-straight-trousers'], colors: [[C.khaki, ['p-straight-trousers']], [C.olive], [C.black]],
      sizes: WAIST(10), featured: true, rating: 4.4, numReviews: 54, sold: 31,
      short: 'Clean, straight-leg trousers in a breathable cotton-linen twill with a comfortable mid rise.',
      highlights: ['Cotton-linen twill', 'Mid rise, straight leg', 'Half-elastic back waist'], fabric: '55% Linen, 45% Cotton', tags: ['trousers'],
    },
    {
      name: 'Cotton Kurta', cat: 'Ethnic Wear', brand: 'AARO Handloom', gender: 'Women', price: 1899,
      images: ['p-cotton-kurta', 'p-kurta2'], colors: [[C.ivory, ['p-cotton-kurta', 'p-kurta2']], [C.rust], [C.black]],
      sizes: WOMEN(10), featured: true, rating: 4.7, numReviews: 61, sold: 28,
      short: 'A breezy handloom cotton kurta with a mandarin collar and delicate pintucks.',
      highlights: ['Handloom cotton', 'Mandarin collar', 'Side slits for movement'], fabric: '100% Handloom Cotton', tags: ['kurta', 'ethnic'],
    },
    {
      name: 'Cotton Shirt', cat: 'Shirts', brand: 'AARO Essentials', gender: 'Men', price: 1899,
      images: ['p-cotton-shirt'], colors: [[C.white, ['p-cotton-shirt']], [C.beige], [C.olive]],
      sizes: APPAREL(12), rating: 4.3, numReviews: 27, sold: 19,
      short: 'A crisp organic cotton poplin shirt that softens beautifully with every wash.',
      highlights: ['Organic cotton poplin', 'Regular fit', 'Curved hem'], fabric: '100% Organic Cotton', tags: ['shirt'],
    },
    {
      name: 'Utility Cargo Trousers', cat: 'Trousers', brand: 'AARO Studio', gender: 'Men', price: 2099,
      images: ['p-cargo', 'look3'], colors: [[C.olive, ['p-cargo', 'look3']], [C.black]],
      sizes: WAIST(8), rating: 4.5, numReviews: 33, sold: 24,
      short: 'Relaxed cargo trousers in washed cotton twill with roomy utility pockets.',
      highlights: ['Washed cotton twill', 'Six pockets', 'Tapered leg'], fabric: '100% Cotton', tags: ['cargo'],
    },
    {
      name: 'Linen Kurta', cat: 'Ethnic Wear', brand: 'AARO Handloom', gender: 'Women', price: 1899,
      images: ['p-linen-kurta', 'cat-ethnic'], colors: [[C.ivory, ['p-linen-kurta', 'cat-ethnic']], [C.olive], [C.black]],
      sizes: WOMEN(9), rating: 4.6, numReviews: 22, sold: 17, newArrival: true,
      short: 'An easy linen kurta with a relaxed silhouette for warm days and long evenings.',
      highlights: ['Pure linen', 'Relaxed A-line', 'Three-quarter sleeves'], fabric: '100% Linen', tags: ['kurta', 'linen'],
    },
    {
      name: 'Linen Shirt', cat: 'Shirts', brand: 'AARO Studio', gender: 'Men', price: 1999,
      images: ['p-linen-shirt', 'cat-new-arrivals'], colors: [[C.sage, ['p-linen-shirt']], [C.black], [C.white]],
      sizes: APPAREL(11), newArrival: true, rating: 4.4, numReviews: 19, sold: 15,
      short: 'Our signature linen shirt — airy, textured and made for everyday wear.',
      highlights: ['Garment-washed linen', 'Relaxed fit', 'Spread collar'], fabric: '100% Linen', tags: ['linen', 'shirt'],
    },
    {
      name: 'Oversized T-Shirt', cat: 'T-Shirts', brand: 'AARO Essentials', gender: 'Unisex', price: 1299,
      images: ['p-oversized-tee'], colors: [[C.white, ['p-oversized-tee']], [C.black], [C.khaki]],
      sizes: APPAREL(18), newArrival: true, rating: 4.2, numReviews: 14, sold: 21,
      short: 'A boxy, oversized tee in dense organic cotton jersey.',
      highlights: ['Drop shoulder', 'Boxy fit', 'Organic cotton'], fabric: '100% Organic Cotton', tags: ['tee', 'oversized'],
    },
    {
      name: 'Cargo Trousers', cat: 'Trousers', brand: 'AARO Studio', gender: 'Men', price: 2299,
      images: ['p-cargo2'], colors: [[C.black, ['p-cargo2']], [C.navy], [C.olive]],
      sizes: WAIST(3), rating: 4.3, numReviews: 12, sold: 11,
      short: 'Sharp black cargos in a soft brushed cotton — utility, refined.',
      highlights: ['Brushed cotton', 'Relaxed straight leg', 'Flap pockets'], fabric: '100% Cotton', tags: ['cargo'],
    },
    {
      name: 'Handwoven Scarf', cat: 'Accessories', brand: 'AARO Handloom', gender: 'Women', price: 1499,
      images: ['p-scarf', 'look4'], colors: [[C.rust, ['p-scarf', 'look4']], [C.black], [C.beige]],
      sizes: [{ label: 'Free Size', stock: 25 }], newArrival: true, rating: 4.8, numReviews: 9, sold: 25,
      short: 'A featherlight handwoven scarf, dyed with low-impact natural dyes.',
      highlights: ['Handwoven by artisans', 'Low-impact dyes', '180 × 70 cm'], fabric: '100% Handloom Cotton', tags: ['scarf', 'handloom'],
    },
    {
      name: 'Linen Shorts', cat: 'Shorts', brand: 'AARO Essentials', gender: 'Men', price: 1799,
      images: ['p-linen-shorts'], colors: [[C.black, ['p-linen-shorts']], [C.beige], [C.olive]],
      sizes: WAIST(9), rating: 4.4, numReviews: 11, sold: 13,
      short: 'Relaxed linen shorts with a drawstring waist — made for sunny days.',
      highlights: ['Pure linen', 'Drawstring waist', '7" inseam'], fabric: '100% Linen', tags: ['shorts', 'linen'],
    },
    {
      name: 'Printed Shirt', cat: 'Shirts', brand: 'AARO Studio', gender: 'Men', price: 1899,
      images: ['p-printed-shirt'], colors: [[C.beige, ['p-printed-shirt']], [C.black], [C.white]],
      sizes: APPAREL(10), rating: 4.5, numReviews: 16, sold: 14,
      short: 'A camp-collar shirt in a hand-block inspired print on breezy cotton.',
      highlights: ['Camp collar', 'Cotton voile', 'Hand-block inspired print'], fabric: '100% Cotton', tags: ['print', 'shirt'],
    },
    {
      name: 'Flowy Dress', cat: 'Dresses', brand: 'AARO Studio', gender: 'Women', price: 2499,
      images: ['p-flowy-dress', 'look2'], colors: [[C.rust, ['p-flowy-dress', 'look2']], [C.white], [C.beige]],
      sizes: WOMEN(8), rating: 4.7, numReviews: 29, sold: 22,
      short: 'A flowing midi dress in soft cotton-linen with a gathered waist and puff sleeves.',
      highlights: ['Cotton-linen blend', 'Gathered waist', 'Side pockets'], fabric: '60% Cotton, 40% Linen', tags: ['dress'],
    },
    {
      name: 'Terracotta Wrap Dress', cat: 'Dresses', brand: 'AARO Studio', gender: 'Women', price: 2699,
      images: ['cat-women', 'look2'], colors: [[C.rust, ['cat-women']], [C.olive]],
      sizes: WOMEN(6), newArrival: true, rating: 4.6, numReviews: 8, sold: 9,
      short: 'A graceful wrap dress in washed linen, finished with a self-tie belt.',
      highlights: ['Washed linen', 'Self-tie belt', 'Midi length'], fabric: '100% Linen', tags: ['dress', 'linen'],
    },
    {
      name: 'Essential Tee Pack', cat: 'T-Shirts', brand: 'AARO Essentials', gender: 'Unisex', price: 2999, comparePrice: 3897,
      images: ['cat-tshirts'], colors: [[{ name: 'Earth Mix', hex: '#7A6A4F' }, ['cat-tshirts']]],
      sizes: APPAREL(15), newArrival: true, rating: 4.5, numReviews: 18, sold: 16,
      short: 'Three organic cotton tees in olive, ivory and rust — your new everyday uniform.',
      highlights: ['Pack of 3', 'Organic cotton', 'Relaxed fit'], fabric: '100% Organic Cotton', tags: ['tee', 'pack'],
    },
  ];

  const products = {};
  for (const [i, d] of P.entries()) {
    const images = [];
    for (const f of d.images) images.push(await img(f, 'product', d.name));
    const colors = [];
    for (const [c, files = []] of d.colors) {
      const ci = [];
      for (const f of files) ci.push(await img(f, 'product', `${d.name} — ${c.name}`));
      colors.push({ ...c, images: ci });
    }
    products[d.name] = await Product.create({
      name: d.name, slug: slugify(d.name), sku: `AR-${String(1001 + i)}`,
      shortDescription: d.short,
      description: `${d.short}\n\nThoughtfully made in small batches in ethical workshops across India. Every AARO piece is designed to be worn often, washed gently and loved for years.`,
      highlights: d.highlights, fabric: d.fabric,
      care: 'Machine wash cold on gentle cycle. Line dry in shade. Warm iron if needed. Do not bleach.',
      category: cats[d.cat]._id, brand: brands[d.brand]._id, gender: d.gender,
      price: d.price, comparePrice: d.comparePrice || 0, images, colors, sizes: d.sizes, tags: d.tags,
      featured: !!d.featured, newArrival: !!d.newArrival, bestSeller: !!d.bestSeller,
      rating: d.rating, numReviews: d.numReviews, sold: d.sold, order: i,
    });
  }

  // ---------- Reviews ----------
  const rv = [
    ['Linen Overshirt', 'Rohan M.', 5, 'Perfect everyday layer', 'The linen is soft right out of the bag and gets better with every wash. Fits true to size.'],
    ['Linen Overshirt', 'Kabir S.', 4, 'Great colour', 'Olive colour is beautiful. Slightly long on me but I love it.'],
    ['Linen Overshirt', 'Aditya R.', 5, 'Worth it', 'Wore it all through a humid week in Goa — breathable and still looks sharp.'],
    ['Cotton Kurta', 'Meera K.', 5, 'So comfortable', 'Light, breathable and the pintucks are lovely. Got so many compliments.'],
    ['Relaxed Fit T-Shirt', 'Ananya P.', 4, 'Solid tee', 'Thick fabric without being heavy. The beige is a perfect neutral.'],
    ['Flowy Dress', 'Isha T.', 5, 'Dreamy', 'The colour is even prettier in person and it has pockets!'],
  ];
  for (const [p, name, rating, title, comment] of rv) {
    await Review.create({ product: products[p]._id, name, rating, title, comment, approved: true, email: `${slugify(name)}@example.com` });
  }

  // ---------- Coupons ----------
  await Coupon.create([
    { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, maxDiscount: 500, showOnSite: true },
    { code: 'FLAT200', description: '₹200 off on orders above ₹1,999', type: 'flat', value: 200, minOrder: 1999 },
  ]);

  // ---------- Journal ----------
  await Post.create([
    {
      title: 'Why We Choose Linen', slug: 'why-we-choose-linen', author: 'Team AARO', tags: ['fabric'],
      excerpt: 'Linen uses a fraction of the water cotton needs and grows softer with every wash. Here’s why it’s at the heart of AARO.',
      content: 'Linen is one of the oldest fabrics in the world — and one of the kindest. Flax, the plant it comes from, grows with little water and no need for irrigation in most climates.\n\nIt breathes beautifully, wicks moisture and keeps you cool through Indian summers. Better still, it softens with every wash, so the shirt you buy today will feel even better next year.\n\nAt AARO we work with mills that trace their flax, and we garment-wash our linen for a lived-in feel from the very first wear.',
      cover: await img('sustain', 'post'), publishedAt: new Date(Date.now() - 12 * 864e5),
    },
    {
      title: 'Slow Mornings: The Lookbook Story', slug: 'slow-mornings-lookbook', author: 'Team AARO', tags: ['lookbook'],
      excerpt: 'Behind the scenes of our latest lookbook, shot in the sunlit courtyards of Jaipur.',
      content: 'We shot our latest lookbook over three slow mornings in Jaipur — chasing soft light across old courtyards and quiet gardens.\n\nThe idea was simple: clothes that move with you and feel at home in real places. No studios, no rush.\n\nEvery piece you see is from our current collection, worn exactly as it is sold.',
      cover: await img('look1', 'post'), publishedAt: new Date(Date.now() - 30 * 864e5),
    },
    {
      title: 'Caring for Natural Fabrics', slug: 'caring-for-natural-fabrics', author: 'Team AARO', tags: ['care'],
      excerpt: 'A few simple habits that keep your cotton, linen and handloom pieces beautiful for years.',
      content: 'Wash less, and wash cold. Natural fibres don’t need hot water — a cool, gentle cycle is kinder to the fabric and the planet.\n\nDry in the shade. Direct sun can fade natural dyes over time.\n\nStore folded, not hung, for knits and handloom. And mend when you can — a loose button is a five-minute fix.',
      cover: await img('look3', 'post'), publishedAt: new Date(Date.now() - 45 * 864e5),
    },
  ]);

  // ---------- Demo customers & orders (so the dashboard has data) ----------
  if (demoOrders) {
    const names = ['Priya Sharma', 'Arjun Mehta', 'Neha Gupta', 'Vikram Rao', 'Sana Khan', 'Rahul Verma', 'Aisha Iyer', 'Karan Malhotra'];
    const customers = [];
    for (const [i, n] of names.entries()) {
      customers.push(await User.create({
        name: n, email: `${slugify(n).replace('-', '.')}@example.com`, password: 'customer123', phone: `98${String(10000000 + i * 1234567).slice(0, 8)}`,
        createdAt: new Date(Date.now() - (200 - i * 20) * 864e5),
      }));
    }
    const list = Object.values(products);
    const statuses = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Packed', 'Confirmed', 'Pending', 'Delivered', 'Shipped', 'Cancelled'];
    let n = 100001;
    for (let i = 0; i < 48; i++) {
      const u = customers[i % customers.length];
      const daysAgo = Math.floor((i / 48) ** 1.3 * 200);
      const created = new Date(Date.now() - daysAgo * 864e5 - (i % 7) * 3600e3);
      const items = [];
      const count = 1 + (i % 3);
      for (let k = 0; k < count; k++) {
        const p = list[(i * 3 + k * 5) % list.length];
        items.push({ product: p._id, name: p.name, slug: p.slug, image: p.images[0], price: p.price, color: p.colors[0]?.name, size: p.sizes[1]?.label || p.sizes[0]?.label, qty: 1 + ((i + k) % 2) });
      }
      const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
      const status = statuses[i % statuses.length];
      const order = new Order({
        orderNumber: `AR${n++}`, user: u._id, customer: { name: u.name, email: u.email, phone: u.phone },
        shippingAddress: { line1: `${12 + i} MG Road`, city: ['Mumbai', 'Delhi', 'Bengaluru', 'Jaipur', 'Pune'][i % 5], state: 'India', pincode: `4000${10 + (i % 80)}` },
        items, subtotal, shipping: subtotal >= 999 ? 0 : 79, discount: 0, total: subtotal + (subtotal >= 999 ? 0 : 79),
        status, paymentStatus: status === 'Delivered' ? 'Paid' : 'Pending',
        statusHistory: [{ status: 'Pending', note: 'Order placed', at: created }, ...(status !== 'Pending' ? [{ status, at: created }] : [])],
      });
      order.createdAt = created;
      order.updatedAt = created;
      await order.save({ timestamps: false });
    }
    await Subscriber.create([{ email: 'priya.sharma@example.com' }, { email: 'arjun.mehta@example.com' }, { email: 'hello@example.com' }]);
  }
  console.log('✔ Demo store seeded');
}

export async function seedIfEmpty() {
  const hasStore = await Singleton.exists({ key: 'content' });
  if (!hasStore) await seedStore({ demoOrders: process.env.SEED_DEMO_ORDERS !== 'false' });
}

// CLI
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  (async () => {
    const { connectDB } = await import('../config/db.js');
    await connectDB();
    const fresh = process.argv.includes('--fresh');
    if (fresh) {
      console.log('… Clearing store data');
      await Promise.all([Category, Brand, Product, Review, Coupon, Order, Post, Image, Singleton, Subscriber].map((M) => M.deleteMany({})));
      await User.deleteMany({ role: 'customer', email: /@example\.com$/ });
    }
    await ensureAdmin();
    if (fresh) await seedStore({ demoOrders: !process.argv.includes('--no-demo-orders') });
    else await seedIfEmpty();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
