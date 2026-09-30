import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { post } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';

// Server-priced summary (prices, coupon, shipping and tax are always computed by the API)
export function useQuote() {
  const { items, coupon } = useCart();
  const payload = { items: items.map((i) => ({ product: i.productId, color: i.color, size: i.size, qty: i.qty })), couponCode: coupon || undefined };
  return useQuery({
    queryKey: ['quote', payload],
    queryFn: () => post('/orders/quote', payload),
    enabled: items.length > 0,
    placeholderData: (prev) => prev,
    retry: false,
  });
}

export default function OrderSummary({ children }) {
  const { t, fmt, offers } = useSite();
  const { coupon, setCoupon, subtotal: localSubtotal } = useCart();
  const quote = useQuote();
  const [showCoupon, setShowCoupon] = useState(!!coupon);
  const [code, setCode] = useState('');
  const q = quote.data;

  useEffect(() => {
    if (quote.isError && coupon) {
      toast.error(quote.error.message, { id: 'coupon' });
      setCoupon('');
    }
  }, [quote.isError, quote.error, coupon, setCoupon]);

  const apply = async (c = code) => {
    if (!c.trim()) return;
    try {
      await post('/coupons/validate', { code: c, subtotal: q?.subtotal ?? localSubtotal });
      setCoupon(c.trim().toUpperCase());
      setCode('');
      toast.success('Coupon applied');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const Row = ({ label, value, strong, accent }) => (
    <div className={`flex justify-between ${strong ? 'text-base font-medium' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted'}>{label}</span>
      <span className={accent ? 'text-emerald-700' : ''}>{value}</span>
    </div>
  );

  return (
    <div className="card p-5 md:p-6">
      <h3 className="font-heading text-2xl">{t('orderSummary')}</h3>
      <div className={`mt-5 space-y-3 transition-opacity ${quote.isFetching ? 'opacity-60' : ''}`}>
        <Row label={t('subtotal')} value={fmt(q?.subtotal ?? localSubtotal)} />
        {q?.discount > 0 && <Row label={`${t('discount')} (${q.couponCode})`} value={`− ${fmt(q.discount)}`} accent />}
        <Row label={t('shipping')} value={q ? (q.shipping ? fmt(q.shipping) : fmt(0)) : '—'} />
        {q?.tax > 0 && <Row label={t('tax')} value={fmt(q.tax)} />}
        <div className="border-t border-line pt-3"><Row strong label={t('total')} value={fmt(q?.total ?? localSubtotal)} /></div>
      </div>

      {children && <div className="mt-6">{children}</div>}

      <div className="mt-4">
        {coupon ? (
          <div className="flex items-center justify-between rounded-brand bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span className="flex items-center gap-2"><Tag size={14} /> {coupon}</span>
            <button onClick={() => setCoupon('')} aria-label="Remove coupon"><X size={15} /></button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowCoupon(!showCoupon)} className="mx-auto block text-xs text-primary underline-offset-4 hover:underline">{t('haveCoupon')}</button>
            <AnimatePresence>
              {showCoupon && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 flex gap-2">
                    <input className="input py-2.5 uppercase" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} />
                    <button onClick={() => apply()} className="btn-dark shrink-0 px-5 py-2.5">{t('applyCoupon')}</button>
                  </div>
                  {offers?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {offers.map((o) => (
                        <button key={o.code} onClick={() => apply(o.code)} className="flex w-full items-center justify-between rounded-brand border border-dashed border-primary/40 px-3 py-2 text-left text-xs hover:bg-primary/5">
                          <span><b className="text-primary">{o.code}</b> · {o.description}</span><span className="text-primary">Apply</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
