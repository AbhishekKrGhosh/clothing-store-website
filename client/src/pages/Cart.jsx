import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { QtyStepper } from '../components/VariantPicker';
import OrderSummary, { useQuote } from '../components/OrderSummary';
import TrustBadges from '../components/TrustBadges';
import FreeShippingBar from '../components/FreeShippingBar';

export default function Cart() {
  const { items, update, remove, count, subtotal } = useCart();
  const { t, fmt } = useSite();
  const nav = useNavigate();
  const quote = useQuote();
  usePageTitle(t('cartTitle'));

  if (!items.length) {
    return (
      <div className="container flex flex-col items-center py-28 text-center">
        <ShoppingBag size={48} strokeWidth={1} className="text-muted" />
        <h1 className="mt-4 font-heading text-4xl">{t('emptyCartTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('emptyCartText')}</p>
        <Link to="/shop" className="btn-primary mt-6">{t('continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8 flex items-end justify-between">
        <h1 className="font-heading text-4xl md:text-5xl">{t('cartTitle')} <span className="font-body text-base text-muted">({count} {t('items')})</span></h1>
        <Link to="/shop" className="link-arrow hidden sm:inline-flex">{t('continueShopping')} <ArrowRight size={15} /></Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <div>
          <FreeShippingBar subtotal={quote.data?.subtotal ?? subtotal} />
          <div className="mt-4 divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.div key={i.key} layout exit={{ opacity: 0, x: -40 }} className="flex gap-4 py-5">
                  <Link to={`/product/${i.slug}`}><Img image={i.image} className="h-32 w-24 rounded-brand md:h-36 md:w-28" sizes="112px" maxWidth={320} /></Link>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link to={`/product/${i.slug}`} className="font-medium hover:text-primary">{i.name}</Link>
                      <p className="mt-1 text-xs text-muted">{[i.color, i.size].filter(Boolean).join(' · ')}</p>
                      <div className="mt-4 flex items-center gap-3">
                        {i.colorHex && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: i.colorHex }} />}
                        <QtyStepper small value={i.qty} max={i.maxStock} onChange={(q) => update(i.key, q)} />
                        <button onClick={() => remove(i.key)} className="rounded-full p-2 text-muted hover:bg-ink/5 hover:text-primary" aria-label="Remove"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="font-medium">{fmt(i.price * i.qty)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <TrustBadges compact className="mt-6 rounded-brand border border-line bg-surface p-5" />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary>
            <button onClick={() => nav('/checkout')} className="btn-primary w-full py-3.5">{t('proceedToCheckout')}</button>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
