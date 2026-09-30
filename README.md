# AARO — MERN Clothing Store

A full clothing store built with **MongoDB, Express, React and Node**. It has three parts:

| Folder    | What it is                                    | Dev URL                 |
|-----------|-----------------------------------------------|-------------------------|
| `server/` | REST API: Express + Mongoose, JWT auth, image pipeline | http://localhost:5000 |
| `client/` | Customer storefront: React, Vite, Tailwind, Framer Motion | http://localhost:5173 |
| `admin/`  | Admin panel: React, Vite, Tailwind, Recharts  | http://localhost:5174   |

**Admin login:** `admin@example.com` / `admin123`. The account is created automatically the first time the server starts.

---

## 1. Setup

```bash
# 1. install everything (root + server + client + admin)
npm run install:all

# 2. add your MongoDB connection string
#    open server/.env and set MONGODB_URI=...
#    (server/.env already exists — copied from server/.env.example)

# 3. run all three apps together
npm run dev
```

On first start the server:
1. creates the admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`
2. seeds the demo store if the database is empty. This includes the settings, every page's content, 9 categories, 3 brands, 16 products, lookbook images, journal stories, coupons, reviews, and some demo customers and orders so the dashboard has data.

Useful scripts:

```bash
npm run seed         # seed only if empty
npm run seed:fresh   # wipe store data (keeps admin) and re-seed
npm --prefix server run seed:fresh -- --no-demo-orders   # re-seed without demo orders/customers
```

Set `AUTO_SEED=false` in `server/.env` to turn off automatic seeding. Set `SEED_DEMO_ORDERS=false` to seed without the demo orders.

> The demo images are cropped from the design mock-up, so they are low resolution. Replace them from the admin panel with real photos: **Products**, **Categories**, and **Banners & Content**.

---

## 2. What the admin controls

Everything you see on the storefront is data, and all of it can be edited from the admin panel:

- **Dashboard**: revenue, orders, customers, rating (with % change), sales chart, order-status donut, top products, recent orders, low stock.
- **Products**: create, edit, duplicate, bulk actions. Covers images (drag to reorder, first image is the cover, second shows on hover), colours with their own images, sizes with stock, price and compare-at price, category, brand, gender, highlights, fabric, care, tags, and the featured / new / best-seller / visible flags.
- **Orders**: filter by status, date or search. Order detail with a status timeline (cancelling puts the items back in stock), payment status, tracking number, print, CSV export.
- **Categories**: image, banner, description, order (↑↓), home-page visibility, shop-filter visibility. A category can also have a **custom link**, e.g. the "New Arrivals" and "Women" tiles point to filters.
- **Brands**: name, logo, description.
- **Customers**: list with orders and total spent, detail view, disable or delete.
- **Inventory**: quick stock editing per size.
- **Banners & Content**:
  - Home-page section order and visibility.
  - Hero: headline, subtitle, buttons, image, feature icons.
  - Shop by Category, the sustainability banner, and Featured products (by featured flag, newest, best sellers, or hand-picked).
  - Lookbook (home strip and full page), newsletter block.
  - Collections page header, About page (hero, intro, story blocks, values), Journal header.
- **Journal**: blog stories with a cover image.
- **Offers & Coupons**: percent or flat discounts, minimum order, maximum discount, usage limit, date window, and whether the coupon is suggested at checkout.
- **Reviews**: approve, hide or delete. Product ratings recalculate automatically.
- **Subscribers**: newsletter list with CSV export.
- **Analytics**: revenue and orders over time, sales by category and audience, top customers, coupon performance.
- **Settings**:
  - Brand name, tagline, logo, favicon.
  - **Colours & fonts** (10 theme colours, heading and body Google fonts, corner radius) with a live preview.
  - Navigation menu, announcement bar, trust badges, footer columns, contact and social links.
  - Currency, free-shipping threshold, shipping fee, tax, COD, auto-approving reviews.
  - Size-guide table, SEO.
  - **Site texts**: every button and label on the storefront.
  - Media storage cleanup.
  - Admin accounts and password.

---

## 3. Images: optimised, stored as base64

Every upload goes through `server/src/utils/image.js`:

1. The browser shrinks very large photos to at most 2400px before uploading, so uploads are fast.
2. The server uses **sharp** to auto-rotate the image, strip its metadata, **resize** it to a maximum for its purpose, and **convert it to WebP**:

   | Purpose | Maximum size |
   |---------|--------------|
   | Products | 1100px |
   | Hero | 1800px |
   | Banners | 1600px |
   | Categories | 800px |
   | Logo | 500px |

3. The result is saved in MongoDB as **base64** (`images` collection), together with a tiny 24px blurred placeholder.
4. Products, categories and content store a small reference to the image: `{ id, url, blur, w, h }`. This keeps product lists light.
5. `GET /api/images/:id?w=480` decodes the base64, resizes to the requested width when needed (with an in-memory cache) and serves it with `Cache-Control: immutable`.

On the storefront, the `<Img>` component shows the blurred placeholder first, then loads a right-sized image through `srcset` with `loading="lazy"`, and fades it in. Pages are code-split, and lists use skeleton loaders and infinite scroll.

**Settings → Media & storage → Remove unused images** deletes images that nothing references any more.

---

## 4. Storefront features

- Home page built from the admin-configured sections, with animated hero, category tiles, sustainability banner, featured products, lookbook and newsletter.
- Collections / shop page:
  - Category chips.
  - Filters: gender, category, brand, size, colour, price.
  - Sorting and search.
  - Infinite scroll.
- Product page:
  - Gallery with thumbnails and hover zoom.
  - Colour-specific images, size and stock state, size guide.
  - Reviews with a star distribution, and related products.
- Quick-add from any product card, a cart drawer, a cart page with a free-shipping progress bar, and coupons.
- **Server-priced checkout**: totals are recalculated on the API, and stock is reserved atomically. Payment is cash on delivery.
- Customer account (register, sign in, orders, cancel, profile, password), guest order tracking, wishlist, About, Journal and Lookbook pages.
- Theme colours and fonts come from the admin settings at runtime. The site is responsive down to small phones.

---

## 5. Production

```bash
npm run build     # builds client/dist and admin/dist (admin base = /admin/)
npm start         # server serves the API, the storefront at /, and the admin at /admin
```

To host the frontends separately (e.g. on Vercel or Netlify), set `VITE_API_URL=https://your-api.com` in `client/.env` and `admin/.env`, and add their domains to `CLIENT_URLS` in `server/.env`. For the admin panel, also set `VITE_STORE_URL=https://your-store.com` so that "View store" links work.

**Before going live**, change `JWT_SECRET` and the admin password (**Settings → Account & admins**).

---

## 6. API overview

| Route | Purpose |
|-------|---------|
| `POST /api/auth/login`, `/register`; `GET/PUT /api/auth/me`; `PUT /api/auth/password` | Authentication |
| `GET /api/site/bootstrap` | Settings, content, categories, brands and offers in one call |
| `GET/PUT /api/site/settings`, `/api/site/content` | Site settings and page content |
| `/api/products` | List with filters, `/filters`, `/:slug`, `/:id/related`, CRUD, `/bulk`, `/:id/duplicate` |
| `/api/categories`, `/api/brands`, `/api/posts`, `/api/coupons` (+ `/validate`) | CRUD |
| `/api/orders` | `/quote`, create, `/mine`, `/track`, `/:id/cancel`, admin list, update, delete |
| `/api/reviews` | Public post and list, admin moderation |
| `/api/images` | Upload (admin), serve, library, cleanup |
| `/api/users` | Admin customer management |
| `/api/dashboard`, `/api/dashboard/analytics` | Stats |
| `/api/subscribers` | Newsletter |
