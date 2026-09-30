import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Heart, Minus, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, imgUrl, post } from '../lib/api';
import { useSite, usePageTitle } from '../context/SiteContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Img from '../components/Img';
import Stars from '../components/Stars';
import Price from '../components/Price';
import Modal from '../components/Modal';
import TrustBadges from '../components/TrustBadges';
import ProductGrid from '../components/ProductGrid';
import { GridSkeleton, Sk } from '../components/Skeleton';
import { ColorPicker, QtyStepper, SizePicker } from '../components/VariantPicker';
import Reveal from '../components/Reveal';
import { fmtDate } from '../lib/format';

export default function Product() {
  const { slug } = useParams();
  const { data: p, isLoading, isError } = useQuery({ queryKey: ['product', slug], queryFn: () => get(`/products/${slug}`) });
  usePageTitle(p?.name);

  if (isError) {
    return (
      <div className="container py-28 text-center">
        <p className="font-heading text-4xl">Product not found</p>
        <Link to="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="container grid gap-10 py-8 md:grid-cols-2">
        <Sk className="aspect-[4/5] w-full" />
        <div className="space-y-4"><Sk className="h-10 w-2/3" /><Sk className="h-4 w-1/3" /><Sk className="h-8 w-1/4" /><Sk className="h-24 w-full" /><Sk className="h-12 w-full" /></div>
      </div>
    );
  }
  return <ProductView key={p._id} p={p} />;
}

function ProductView({ p }) {
  const { t, settings } = useSite();
  const { add, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const nav = useNavigate();
  const [color, setColor] = useState(p.colors?.[0] || null);
  const [size, setSize] = useState(() => {
    const inStock = (p.sizes || []).filter((s) => s.stock > 0);
    return inStock.length === 1 ? inStock[0] : null;
  });
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);

  const images = useMemo(() => {
    const ci = color?.images?.filter(Boolean) || [];
    const rest = (p.images || []).filter((im) => !ci.some((c) => c.id === im.id));
    return ci.length ? [...ci, ...rest] : p.images || [];
  }, [color, p.images]);

  const totalStock = (p.sizes || []).reduce((s, x) => s + x.stock, 0);
  const noSizes = !p.sizes?.length;
  const stock = size ? size.stock : totalStock;
  const inStock = noSizes || totalStock > 0;
  const low = inStock && !noSizes && stock > 0 && stock <= (settings.commerce.lowStockThreshold || 5);

  const addToBag = (buyNow = false) => {
    if (!noSizes && !size) return toast.error('Please select a size');
    add(p, { color: color?.name, colorHex: color?.hex, size: size?.label, qty, image: images[0], maxStock: size?.stock ?? 99 });
    if (buyNow) return nav('/checkout');
    toast.success(t('addedToBag'));
    setOpen(true);
  };

  return (
    <>
      <div className="container pt-5">
        <nav className="flex items-center gap-1 text-xs text-muted">
          <Link to="/" className="hover:text-ink">Home</Link><ChevronRight size={12} />
          <Link to="/shop" className="hover:text-ink">Shop</Link>
          {p.category && (<><ChevronRight size={12} /><Link to={`/shop?category=${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link></>)}
          <ChevronRight size={12} /><span className="truncate text-ink">{p.name}</span>
        </nav>
      </div>

      <section className="container grid gap-8 py-6 md:grid-cols-[1.1fr,1fr] md:gap-12 lg:gap-16">
        <Gallery images={images} name={p.name} liked={has(p._id)} onLike={() => toggle(p)} />

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="md:sticky md:top-24 md:self-start">
          {p.brand && <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">{p.brand.name}</p>}
          <h1 className="font-heading text-4xl font-medium leading-tight md:text-5xl">{p.name}</h1>
          {p.numReviews > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
              <Stars value={p.rating} /> {p.rating} ({p.numReviews} {t('reviews')})
            </a>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={p.price} compare={p.comparePrice} big />
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${inStock ? (low ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700') : 'bg-red-50 text-red-700'}`}>
              {!inStock ? t('outOfStock') : low ? `${t('lowStock')} (${stock})` : t('inStock')}
            </span>
          </div>
          {p.shortDescription && <p className="mt-4 text-sm leading-relaxed text-ink/75">{p.shortDescription}</p>}

          <div className="mt-6 space-y-6">
            <ColorPicker colors={p.colors} value={color?.name} onChange={setColor} />
            <SizePicker sizes={p.sizes} value={size?.label} onChange={(s) => { setSize(s); setQty((q) => Math.min(q, s.stock)); }} onGuide={() => setGuide(true)} />
            <div className="flex items-center gap-4">
              <QtyStepper value={qty} onChange={setQty} max={Math.max(1, size?.stock ?? 20)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button whileTap={{ scale: 0.98 }} disabled={!inStock} onClick={() => addToBag(false)} className="btn-primary flex-1 py-3.5">{inStock ? t('addToBag') : t('outOfStock')}</motion.button>
              {inStock && <button onClick={() => addToBag(true)} className="btn-outline flex-1 py-3.5">{t('buyNow')}</button>}
            </div>
          </div>

          <TrustBadges compact className="mt-7 border-t border-line pt-6" />

          <div className="mt-6 border-t border-line">
            <Accordion title={t('description')} defaultOpen>
              <p className="whitespace-pre-line">{p.description || p.shortDescription}</p>
              {p.highlights?.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5">{p.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
              )}
            </Accordion>
            {(p.fabric || p.care) && (
              <Accordion title={t('fabricCare')}>
                {p.fabric && <p><span className="font-medium text-ink">Fabric:</span> {p.fabric}</p>}
                {p.care && <p className="mt-2 whitespace-pre-line">{p.care}</p>}
              </Accordion>
            )}
            {p.sku && <p className="py-3 text-xs text-muted">SKU: {p.sku}</p>}
          </div>
        </motion.div>
      </section>

      <Reviews product={p} />
      <Related product={p} />

      <Modal open={guide} onClose={() => setGuide(false)} title={settings.sizeGuide.title}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{settings.sizeGuide.headers.map((h) => <th key={h} className="border-b border-line py-2 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody>{settings.sizeGuide.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line/60 py-2">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {settings.sizeGuide.note && <p className="mt-4 text-xs text-muted">{settings.sizeGuide.note}</p>}
      </Modal>
    </>
  );
}

function Gallery({ images, name, liked, onLike }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  useEffect(() => setI(0), [images]);
  const cur = images[i];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto md:max-h-[640px] md:w-20 md:flex-col md:overflow-y-auto">
          {images.map((im, k) => (
            <button key={im.id || k} onClick={() => setI(k)} className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${k === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Img image={im} className="h-24 w-20" sizes="80px" maxWidth={320} />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative flex-1 cursor-zoom-in overflow-hidden rounded-brand bg-surface-alt"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={cur?.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <Img
              image={cur}
              alt={name}
              eager
              className="aspect-[4/5] w-full"
              sizes="(min-width:768px) 50vw, 100vw"
              imgClassName="!duration-200"
            />
          </motion.div>
        </AnimatePresence>
        {zoom && cur && (
          <div
            className="pointer-events-none absolute inset-0 hidden bg-no-repeat md:block"
            style={{ backgroundImage: `url(${imgUrl(cur, 1600)})`, backgroundSize: '200%', backgroundPosition: `${zoom.x}% ${zoom.y}%` }}
          />
        )}
        <motion.button whileTap={{ scale: 0.8 }} onClick={onLike} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur" aria-label="Wishlist">
          <Heart size={18} className={liked ? 'fill-primary text-primary' : ''} />
        </motion.button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
            {images.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-ink' : 'w-1.5 bg-ink/30'}`} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-sm font-medium">
        {title} {open ? <Minus size={16} /> : <Plus size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-5 text-sm leading-relaxed text-ink/75">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Reviews({ product }) {
  const { t } = useSite();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['reviews', product._id], queryFn: () => get(`/reviews/product/${product._id}`) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '', name: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await post('/reviews', { ...form, product: product._id, name: user?.name || form.name });
      toast.success(res.message);
      setOpen(false);
      setForm({ rating: 5, title: '', comment: '', name: '' });
      qc.invalidateQueries({ queryKey: ['reviews', product._id] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items || [];
  return (
    <section id="reviews" className="container scroll-mt-24 border-t border-line py-12">
      <div className="grid gap-10 md:grid-cols-[280px,1fr]">
        <Reveal>
          <h2 className="section-title">Reviews</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-heading text-5xl">{product.rating || '–'}</span>
            <div><Stars value={product.rating} size={16} /><p className="mt-1 text-xs text-muted">{product.numReviews} {t('reviews')}</p></div>
          </div>
          {data?.distribution && items.length > 0 && (
            <div className="mt-5 space-y-1.5">
              {data.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{d.star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-amber-500" style={{ width: `${(d.count / items.length) * 100}%` }} /></div>
                  <span className="w-5 text-right text-muted">{d.count}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setOpen(true)} className="btn-outline mt-6 w-full">{t('writeReview')}</button>
        </Reveal>
        <div className="space-y-6">
          {items.length === 0 && <p className="text-sm text-muted">No reviews yet — be the first to share your thoughts.</p>}
          {items.map((r) => (
            <Reveal key={r._id} className="border-b border-line pb-6">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <span className="text-xs text-muted">{fmtDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm leading-relaxed text-ink/75">{r.comment}</p>}
              <p className="mt-2 text-xs text-muted">— {r.name}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('writeReview')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="label">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} className="p-0.5" aria-label={`${n} stars`}>
                  <Star size={28} strokeWidth={1.4} className={form.rating >= n ? 'fill-amber-500 text-amber-500' : 'text-accent'} />
                </button>
              ))}
            </div>
          </div>
          {!user && <div><label className="label">Your name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Review</label><textarea rows={4} className="input" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></div>
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Submitting…' : 'Submit review'}</button>
        </form>
      </Modal>
    </section>
  );
}

function Related({ product }) {
  const { t } = useSite();
  const { data, isLoading } = useQuery({ queryKey: ['related', product._id], queryFn: () => get(`/products/${product._id}/related`, { limit: 4 }) });
  if (!isLoading && !data?.length) return null;
  return (
    <section className="container section border-t border-line">
      <h2 className="section-title mb-8">{t('youMightAlsoLike')}</h2>
      {isLoading ? <GridSkeleton count={4} /> : <ProductGrid products={data} />}
    </section>
  );
}
