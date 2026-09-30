import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import Img from './Img';
import { QtyStepper } from './VariantPicker';
import FreeShippingBar from './FreeShippingBar';

export default function CartDrawer() {
  const { items, open, setOpen, update, remove, subtotal, count } = useCart();
  const { t, fmt } = useSite();
  const nav = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const go = (to) => {
    setOpen(false);
    nav(to);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="font-heading text-2xl">{t('cartTitle')} <span className="font-body text-sm text-muted">({count} {t('items')})</span></h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Close cart"><X size={20} /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <ShoppingBag size={40} strokeWidth={1} className="text-muted" />
                <p className="font-heading text-2xl">{t('emptyCartTitle')}</p>
                <p className="text-sm text-muted">{t('emptyCartText')}</p>
                <button className="btn-primary mt-3" onClick={() => go('/shop')}>{t('continueShopping')}</button>
              </div>
            ) : (
              <>
                <div className="px-5 pt-4"><FreeShippingBar subtotal={subtotal} /></div>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.div key={i.key} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }} className="flex gap-3">
                        <Link to={`/product/${i.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                          <Img image={i.image} className="h-24 w-20 rounded-brand" sizes="80px" maxWidth={320} />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <p className="truncate text-sm font-medium">{i.name}</p>
                            <p className="text-sm">{fmt(i.price * i.qty)}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">{[i.color, i.size].filter(Boolean).join(' · ')}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <QtyStepper small value={i.qty} max={i.maxStock} onChange={(q) => update(i.key, q)} />
                            <button onClick={() => remove(i.key)} className="rounded-full p-2 text-muted hover:bg-ink/5 hover:text-primary" aria-label="Remove"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="space-y-3 border-t border-line p-5">
                  <div className="flex justify-between text-sm"><span className="text-muted">{t('subtotal')}</span><span className="font-medium">{fmt(subtotal)}</span></div>
                  <button className="btn-primary w-full" onClick={() => go('/checkout')}>{t('proceedToCheckout')}</button>
                  <button className="btn-outline w-full" onClick={() => go('/cart')}>View {t('cartTitle').toLowerCase()}</button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
