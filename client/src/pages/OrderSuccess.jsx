import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { get } from '../lib/api';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { fmtDate } from '../lib/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const { t, fmt } = useSite();
  usePageTitle(t('orderSuccessTitle'));
  const cached = sessionStorage.getItem(`aaro_order_${id}`);
  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => get(`/orders/${id}`),
    initialData: cached ? JSON.parse(cached) : undefined,
    enabled: !cached,
    retry: false,
  });

  return (
    <div className="container max-w-2xl py-14 text-center md:py-20">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
        <Check size={30} />
      </motion.div>
      <h1 className="mt-6 font-heading text-4xl md:text-5xl">{t('orderSuccessTitle')}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">{t('orderSuccessText')}</p>
      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card mt-10 p-6 text-left">
          <div className="flex flex-wrap justify-between gap-2 border-b border-line pb-4 text-sm">
            <div><p className="text-muted">Order</p><p className="font-medium">#{order.orderNumber}</p></div>
            <div><p className="text-muted">Date</p><p className="font-medium">{fmtDate(order.createdAt)}</p></div>
            <div><p className="text-muted">Payment</p><p className="font-medium">{t('cod')}</p></div>
            <div><p className="text-muted">{t('total')}</p><p className="font-medium">{fmt(order.total)}</p></div>
          </div>
          <div className="space-y-3 py-4">
            {order.items.map((i, k) => (
              <div key={k} className="flex items-center gap-3">
                <Img image={i.image} className="h-16 w-14 rounded-lg" sizes="56px" maxWidth={160} />
                <div className="flex-1 text-sm"><p>{i.name}</p><p className="text-xs text-muted">{[i.color, i.size, `Qty ${i.qty}`].filter(Boolean).join(' · ')}</p></div>
                <p className="text-sm">{fmt(i.price * i.qty)}</p>
              </div>
            ))}
          </div>
          <p className="border-t border-line pt-4 text-xs text-muted">
            Shipping to {order.customer.name}, {order.shippingAddress.line1}, {order.shippingAddress.city} {order.shippingAddress.pincode}. A confirmation will be sent to {order.customer.email}.
          </p>
        </motion.div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-primary">{t('continueShopping')}</Link>
        <Link to={`/track${order ? `?order=${order.orderNumber}&email=${encodeURIComponent(order.customer.email)}` : ''}`} className="btn-outline">Track order</Link>
      </div>
    </div>
  );
}
