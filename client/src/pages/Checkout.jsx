import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { post } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import OrderSummary from '../components/OrderSummary';

const Field = ({ label, className = '', ...p }) => (
  <div className={className}>
    <label className="label">{label}</label>
    <input className="input" {...p} />
  </div>
);

export default function Checkout() {
  const { items, coupon, clear } = useCart();
  const { user } = useAuth();
  const { t, fmt } = useSite();
  const nav = useNavigate();
  const qc = useQueryClient();
  usePageTitle(t('checkoutTitle'));
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', notes: '' });

  useEffect(() => {
    if (!user) return;
    const a = user.addresses?.[0] || {};
    setF((x) => ({ ...x, name: x.name || user.name, email: x.email || user.email, phone: x.phone || user.phone || a.phone || '', line1: x.line1 || a.line1 || '', line2: x.line2 || a.line2 || '', city: x.city || a.city || '', state: x.state || a.state || '', pincode: x.pincode || a.pincode || '' }));
  }, [user]);

  if (!items.length && !busy) return <Navigate to="/cart" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const order = await post('/orders', {
        items: items.map((i) => ({ product: i.productId, color: i.color, size: i.size, qty: i.qty })),
        couponCode: coupon || undefined,
        customer: { name: f.name, email: f.email, phone: f.phone },
        shippingAddress: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
        notes: f.notes,
      });
      sessionStorage.setItem(`aaro_order_${order._id}`, JSON.stringify(order));
      clear();
      qc.invalidateQueries({ queryKey: ['shop'] });
      nav(`/order/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container py-8 md:py-12">
      <h1 className="mb-8 font-heading text-4xl md:text-5xl">{t('checkoutTitle')}</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr,400px]">
        <div className="space-y-8">
          {!user && (
            <p className="rounded-brand bg-surface-alt/70 px-4 py-3 text-sm">
              Have an account? <Link to="/account?next=/checkout" className="font-medium text-primary">Sign in</Link> for faster checkout.
            </p>
          )}
          <section>
            <h2 className="mb-4 font-heading text-2xl">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required value={f.name} onChange={set('name')} className="sm:col-span-2" autoComplete="name" />
              <Field label="Email" type="email" required value={f.email} onChange={set('email')} autoComplete="email" />
              <Field label="Phone" type="tel" required value={f.phone} onChange={set('phone')} autoComplete="tel" pattern="[0-9+\s-]{7,}" />
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-heading text-2xl">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address line 1" required value={f.line1} onChange={set('line1')} className="sm:col-span-2" autoComplete="address-line1" />
              <Field label="Address line 2 (optional)" value={f.line2} onChange={set('line2')} className="sm:col-span-2" autoComplete="address-line2" />
              <Field label="City" required value={f.city} onChange={set('city')} autoComplete="address-level2" />
              <Field label="State" required value={f.state} onChange={set('state')} autoComplete="address-level1" />
              <Field label="PIN code" required value={f.pincode} onChange={set('pincode')} autoComplete="postal-code" />
            </div>
            <div className="mt-4">
              <label className="label">Order notes (optional)</label>
              <textarea rows={3} className="input" value={f.notes} onChange={set('notes')} />
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-heading text-2xl">Payment</h2>
            <label className="flex items-center gap-3 rounded-brand border-2 border-ink bg-surface p-4">
              <input type="radio" checked readOnly className="accent-primary" />
              <Banknote size={20} strokeWidth={1.5} />
              <span className="text-sm font-medium">{t('cod')}</span>
            </label>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card max-h-72 space-y-3 overflow-y-auto p-4">
            {items.map((i) => (
              <div key={i.key} className="flex items-center gap-3">
                <div className="relative">
                  <Img image={i.image} className="h-16 w-14 rounded-lg" sizes="56px" maxWidth={160} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-bg">{i.qty}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.name}</p>
                  <p className="text-xs text-muted">{[i.color, i.size].filter(Boolean).join(' · ')}</p>
                </div>
                <p className="text-sm">{fmt(i.price * i.qty)}</p>
              </div>
            ))}
          </div>
          <OrderSummary>
            <button disabled={busy} className="btn-primary w-full py-3.5">
              <Lock size={15} /> {busy ? 'Placing order…' : t('placeOrder')}
            </button>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
