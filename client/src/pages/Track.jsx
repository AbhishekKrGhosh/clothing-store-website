import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { get } from '../lib/api';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { fmtDate } from '../lib/format';

const STEPS = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export default function Track() {
  usePageTitle('Track order');
  const { fmt } = useSite();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ orderNumber: sp.get('order') || '', email: sp.get('email') || '' });
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try { setOrder(await get('/orders/track', f)); } catch (err) { toast.error(err.message); setOrder(null); } finally { setBusy(false); }
  };
  useEffect(() => { if (f.orderNumber && f.email) lookup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const idx = order ? STEPS.indexOf(order.status) : -1;
  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <h1 className="font-heading text-4xl md:text-5xl">Track your order</h1>
      <form onSubmit={lookup} className="mt-8 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
        <input className="input" placeholder="Order number e.g. AR100050" required value={f.orderNumber} onChange={(e) => setF({ ...f, orderNumber: e.target.value })} />
        <input className="input" type="email" placeholder="Email used at checkout" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <button disabled={busy} className="btn-primary">{busy ? '…' : 'Track'}</button>
      </form>
      {order && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mt-10 p-6">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">#{order.orderNumber}</p>
            <p className="text-sm text-muted">{fmtDate(order.createdAt)} · {fmt(order.total)}</p>
          </div>
          {order.status === 'Cancelled' ? (
            <p className="mt-6 rounded-brand bg-red-50 p-3 text-sm text-red-700">This order was cancelled.</p>
          ) : (
            <div className="mt-8 flex items-center">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${i <= idx ? 'bg-primary text-white' : 'bg-surface-alt text-muted'}`}>
                      {i <= idx ? <Check size={14} /> : i + 1}
                    </motion.span>
                    <span className="mt-2 text-[10px] sm:text-xs">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < idx ? 'bg-primary' : 'bg-line'}`} />}
                </div>
              ))}
            </div>
          )}
          {order.trackingNumber && <p className="mt-6 text-sm">Tracking number: <b>{order.trackingNumber}</b></p>}
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            {order.items.map((i, k) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <Img image={i.image} className="h-14 w-12 rounded-lg" sizes="48px" maxWidth={160} />
                <span className="flex-1">{i.name} <span className="text-muted">× {i.qty}</span></span>
                <span>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
