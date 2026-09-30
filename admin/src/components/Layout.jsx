import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Bell, BookOpen, Boxes, ChevronDown, ExternalLink, FolderTree, Image as ImageIcon, LayoutDashboard, LogOut, Mail, Menu,
  MessageSquare, Package, Search, Settings, ShoppingCart, Tag, TicketPercent, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { get } from '../lib/api';
import { Spinner } from './ui';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/products', 'Products', Package],
  ['/orders', 'Orders', ShoppingCart],
  ['/categories', 'Categories', FolderTree],
  ['/brands', 'Brands', Tag],
  ['/customers', 'Customers', Users],
  ['/inventory', 'Inventory', Boxes],
  ['/content', 'Banners & Content', ImageIcon],
  ['/journal', 'Journal', BookOpen],
  ['/coupons', 'Offers & Coupons', TicketPercent],
  ['/reviews', 'Reviews', MessageSquare],
  ['/subscribers', 'Subscribers', Mail],
  ['/analytics', 'Analytics', BarChart3],
  ['/settings', 'Settings', Settings],
];

export const STORE_URL = import.meta.env.VITE_STORE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '/');

function Sidebar({ onNavigate, badges }) {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => get('/site/settings'), staleTime: 60_000 });
  return (
    <div className="flex h-full flex-col bg-side text-white/80">
      <div className="px-6 pb-6 pt-6">
        <p className="font-serif text-[1.7rem] font-semibold leading-none tracking-[0.18em] text-white">{data?.brand?.name || 'AARO'}</p>
        <p className="mt-1 text-[11px] text-white/50">Admin Panel</p>
      </div>
      <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {NAV.map(([to, label, I]) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate}
            className={({ isActive }) => `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${isActive ? 'text-side' : 'hover:bg-white/5 hover:text-white'}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-cream" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                <I size={16} className="relative" strokeWidth={1.7} />
                <span className="relative flex-1">{label}</span>
                {badges[to] > 0 && <span className="relative rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">{badges[to]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <a href={STORE_URL} target="_blank" rel="noreferrer" className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs text-white/70 hover:bg-white/5">
        View store <ExternalLink size={13} />
      </a>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();
  const { data: dash } = useQuery({ queryKey: ['badges'], queryFn: () => get('/orders', { status: 'Pending', limit: 1 }), refetchInterval: 60_000 });
  const { data: rev } = useQuery({ queryKey: ['review-badge'], queryFn: () => get('/reviews', { status: 'pending', limit: 1 }), refetchInterval: 60_000 });
  const badges = { '/orders': dash?.total || 0, '/reviews': rev?.pending || 0 };

  useEffect(() => { setMobile(false); setMenu(false); }, [loc.pathname]);

  const search = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const s = q.trim();
    nav(/^AR\d+$/i.test(s) ? `/orders?q=${s}` : `/products?q=${encodeURIComponent(s)}`);
    setQ('');
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block"><Sidebar badges={badges} /></aside>
      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="absolute inset-y-0 left-0 w-64">
              <button onClick={() => setMobile(false)} className="absolute right-3 top-5 z-10 text-white/60"><X size={20} /></button>
              <Sidebar badges={badges} onNavigate={() => setMobile(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur md:px-6">
          <button onClick={() => setMobile(true)} className="btn-icon lg:hidden"><Menu size={20} /></button>
          <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, products, customers…" className="w-full rounded-lg bg-canvas py-2 pl-9 pr-3 text-sm" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => nav('/orders?status=Pending')} className="btn-icon relative" title="Pending orders">
              <Bell size={18} />
              {badges['/orders'] > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" />}
            </button>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[13px] font-medium">{user?.name}</span>
                  <span className="block text-[11px] text-muted">{user?.email}</span>
                </span>
                <ChevronDown size={14} className="text-muted" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-1 w-48 rounded-xl border border-line bg-white p-1 shadow-xl">
                    <button onClick={() => nav('/settings?tab=account')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-canvas"><Settings size={15} /> Account</button>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={15} /> Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-6 lg:px-8">
          <Suspense fallback={<div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>}>
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
        <footer className="flex flex-wrap justify-between gap-2 px-4 pb-6 text-[11px] text-muted md:px-8">
          <span>© {new Date().getFullYear()} Admin</span><span>Made with care. For a better tomorrow.</span>
        </footer>
      </div>
    </div>
  );
}
