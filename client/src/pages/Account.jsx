import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { fmtDate } from '../lib/format';

export default function Account() {
  const { user, ready } = useAuth();
  usePageTitle(user ? 'My account' : 'Sign in');
  if (!ready) return <div className="min-h-[50vh]" />;
  return user ? <Dashboard /> : <AuthForms />;
}

function AuthForms() {
  const { login, register } = useAuth();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') await login(f.email, f.password);
      else await register(f);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created');
      if (sp.get('next')) nav(sp.get('next'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="container flex justify-center py-14 md:py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 grid grid-cols-2 rounded-full bg-surface-alt p-1">
          {['login', 'register'].map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`relative rounded-full py-2.5 text-sm transition ${mode === m ? 'text-bg' : 'text-muted'}`}>
              {mode === m && <motion.span layoutId="authTab" className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative">{m === 'login' ? 'Sign in' : 'Create account'}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <h1 className="font-heading text-4xl">{mode === 'login' ? 'Welcome back' : 'Join us'}</h1>
            {mode === 'register' && (
              <>
                <div><label className="label">Full name</label><input required className="input" value={f.name} onChange={set('name')} /></div>
                <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
              </>
            )}
            <div><label className="label">Email</label><input type="email" required className="input" value={f.email} onChange={set('email')} autoComplete="email" /></div>
            <div><label className="label">Password</label><input type="password" required minLength={6} className="input" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
            <button disabled={busy} className="btn-primary w-full py-3.5">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <p className="text-center text-xs text-muted">Just want to check an order? <Link to="/track" className="text-primary">Track it here</Link></p>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700', Confirmed: 'bg-sky-50 text-sky-700', Packed: 'bg-violet-50 text-violet-700',
  Shipped: 'bg-indigo-50 text-indigo-700', Delivered: 'bg-emerald-50 text-emerald-700', Cancelled: 'bg-red-50 text-red-700',
};

function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const { fmt } = useSite();
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const { data: orders, isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: () => get('/orders/mine') });
  const addr = user.addresses?.[0] || {};
  const [p, setP] = useState({ name: user.name, phone: user.phone || '', line1: addr.line1 || '', line2: addr.line2 || '', city: addr.city || '', state: addr.state || '', pincode: addr.pincode || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const u = await put('/auth/me', { name: p.name, phone: p.phone, addresses: [{ ...addr, label: 'Home', name: p.name, phone: p.phone, line1: p.line1, line2: p.line2, city: p.city, state: p.state, pincode: p.pincode }] });
      setUser(u);
      toast.success('Profile saved');
    } catch (err) { toast.error(err.message); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    try { await put('/auth/password', pw); toast.success('Password updated'); setPw({ currentPassword: '', newPassword: '' }); } catch (err) { toast.error(err.message); }
  };
  const cancel = async (id) => {
    try { await post(`/orders/${id}/cancel`); toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['my-orders'] }); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Hello,</p>
          <h1 className="font-heading text-4xl md:text-5xl">{user.name}</h1>
        </div>
        <button onClick={logout} className="btn-ghost text-muted"><LogOut size={16} /> Sign out</button>
      </div>
      <div className="mt-8 flex gap-6 border-b border-line">
        {[['orders', 'Orders'], ['profile', 'Profile']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`relative pb-3 text-sm ${tab === k ? 'text-ink' : 'text-muted'}`}>
            {l}{tab === k && <motion.span layoutId="accTab" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <div className="mt-8 space-y-4">
          {isLoading && <p className="text-sm text-muted">Loading orders…</p>}
          {orders?.length === 0 && (
            <div className="py-16 text-center"><Package size={40} strokeWidth={1} className="mx-auto text-muted" /><p className="mt-3 text-sm text-muted">No orders yet.</p><Link to="/shop" className="btn-primary mt-5">Start shopping</Link></div>
          )}
          {orders?.map((o) => (
            <motion.div key={o._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">#{o.orderNumber}</p>
                  <p className="text-xs text-muted">{fmtDate(o.createdAt)} · {o.items.length} item(s) · {fmt(o.total)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                  {['Pending', 'Confirmed'].includes(o.status) && <button onClick={() => cancel(o._id)} className="text-xs text-muted underline-offset-4 hover:text-primary hover:underline">Cancel</button>}
                </div>
              </div>
              <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
                {o.items.map((i, k) => <Img key={k} image={i.image} className="h-20 w-16 shrink-0 rounded-lg" sizes="64px" maxWidth={160} />)}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <form onSubmit={saveProfile} className="space-y-4">
            <h2 className="font-heading text-2xl">Details & address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Name</label><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Address line 1</label><input className="input" value={p.line1} onChange={(e) => setP({ ...p, line1: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Address line 2</label><input className="input" value={p.line2} onChange={(e) => setP({ ...p, line2: e.target.value })} /></div>
              <div><label className="label">City</label><input className="input" value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} /></div>
              <div><label className="label">State</label><input className="input" value={p.state} onChange={(e) => setP({ ...p, state: e.target.value })} /></div>
              <div><label className="label">PIN code</label><input className="input" value={p.pincode} onChange={(e) => setP({ ...p, pincode: e.target.value })} /></div>
            </div>
            <button className="btn-primary">Save</button>
          </form>
          <form onSubmit={savePw} className="space-y-4">
            <h2 className="font-heading text-2xl">Change password</h2>
            <div><label className="label">Current password</label><input type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div><label className="label">New password</label><input type="password" minLength={6} className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
            <button className="btn-dark">Update password</button>
          </form>
        </div>
      )}
    </div>
  );
}
