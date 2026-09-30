import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(f.email, f.password); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-side lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,83,42,.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(239,232,220,.12),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <p className="font-serif text-3xl tracking-[0.2em]">AARO</p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="font-serif text-5xl leading-tight">Everything in your store,<br />in one calm place.</p>
            <p className="mt-4 max-w-md text-sm text-white/60">Products, content, orders, customers and every word on your site — managed from here.</p>
          </motion.div>
          <p className="text-xs text-white/40">Made with care. For a better tomorrow.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <p className="font-serif text-3xl tracking-[0.2em] lg:hidden">AARO</p>
          <h1 className="mt-6 text-2xl font-semibold lg:mt-0">Sign in to Admin</h1>
          <p className="mt-1 text-sm text-muted">Enter your admin credentials to continue.</p>
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="email" required placeholder="admin@example.com" className="input pl-9" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="password" required placeholder="Password" className="input pl-9" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
            </div>
            <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
