import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import Img from './Img';
import QuickAdd from './QuickAdd';
import { useWishlist } from '../context/WishlistContext';
import { useSite } from '../context/SiteContext';

export default function ProductCard({ product, eager = false, showMeta = true }) {
  const { has, toggle } = useWishlist();
  const { fmt, t } = useSite();
  const [quick, setQuick] = useState(false);
  const liked = has(product._id);
  const img2 = product.images?.[1];
  const soldOut = product.sizes?.length && product.sizes.every((s) => s.stock <= 0);
  const off = product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <div className="group relative">
      <div className="relative overflow-hidden rounded-brand bg-surface-alt">
        <Link to={`/product/${product.slug}`} className="block" aria-label={product.name}>
          <Img
            image={product.images?.[0]}
            alt={product.name}
            eager={eager}
            className="aspect-[4/5] w-full"
            imgClassName="group-hover:scale-[1.04]"
            sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw"
            maxWidth={800}
          />
          {img2 && (
            <Img
              image={img2}
              alt=""
              className="!absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw"
              maxWidth={800}
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {soldOut ? (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">{t('outOfStock')}</span>
          ) : (
            <>
              {product.newArrival && <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur">New</span>}
              {off > 0 && <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-white">-{off}%</span>}
            </>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggle(product)}
          aria-label="Add to wishlist"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart size={15} className={liked ? 'fill-primary text-primary' : 'text-ink/70'} />
        </motion.button>
      </div>

      {showMeta && (
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/product/${product.slug}`} className="block truncate text-sm font-medium hover:text-primary">{product.name}</Link>
            <p className="mt-0.5 text-xs text-muted">{product.gender}</p>
            <p className="mt-1 text-sm">
              {fmt(product.price)}
              {off > 0 && <span className="ml-1.5 text-xs text-muted line-through">{fmt(product.comparePrice)}</span>}
            </p>
            {product.colors?.length > 0 && (
              <div className="mt-2 flex gap-1.5">
                {product.colors.slice(0, 5).map((c) => (
                  <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-ink/10" style={{ backgroundColor: c.hex }} />
                ))}
                {product.colors.length > 5 && <span className="text-[10px] text-muted">+{product.colors.length - 5}</span>}
              </div>
            )}
          </div>
          {!soldOut && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuick(true)}
              aria-label="Quick add to bag"
              className="mt-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary-dark"
            >
              <ShoppingBag size={16} />
            </motion.button>
          )}
        </div>
      )}
      <QuickAdd product={product} open={quick} onClose={() => setQuick(false)} />
    </div>
  );
}
