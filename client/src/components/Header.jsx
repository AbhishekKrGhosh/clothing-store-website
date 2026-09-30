import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import { useSite } from '../context/SiteContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function Badge({ n }) {
  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.span
          key={n}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white"
        >
          {n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const isActive = (loc, url) => {
  const [path, qs] = url.split('?');
  if (path === '/') return loc.pathname === '/';
  if (qs) return loc.pathname === path && loc.search.includes(qs);
  return loc.pathname.startsWith(path) && (path !== '/shop' || !/gender=/.test(loc.search));
};

export default function Header() {
  const { settings } = useSite();
  const { count, setOpen } = useCart();
  const { count: wish } = useWishlist();
  const loc = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMenu(false), [loc.pathname, loc.search]);

  const a = settings.announcement;
  const nav = settings.nav || [];

  return (
    <>
      {a?.enabled && a.text && (
        <div className="bg-secondary text-center text-[11px] tracking-wide text-white/90 md:text-xs">
          <Link to={a.link || '/shop'} className="block truncate px-4 py-2">{a.text}</Link>
        </div>
      )}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg/85 shadow-[0_1px_0_rgb(var(--c-border))] backdrop-blur-xl' : 'bg-bg'}`}>
        <div className="container flex h-16 items-center gap-4 md:h-[72px]">
          <button className="-ml-2 rounded-full p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={22} strokeWidth={1.5} /></button>
          <Logo className="lg:mr-10" />
          <nav className="hidden flex-1 items-center gap-8 lg:flex">
            {nav.map((l) => (
              <NavLink key={l.url + l.label} to={l.url} className={`group relative py-2 text-sm transition-colors ${isActive(loc, l.url) ? 'text-ink' : 'text-ink/70 hover:text-ink'}`}>
                {l.label}
                <span className={`absolute -bottom-0.5 left-0 h-px bg-primary transition-all duration-300 ${isActive(loc, l.url) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-0.5 md:gap-1.5">
            <button onClick={() => setSearch(true)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Search"><Search size={19} strokeWidth={1.5} /></button>
            <Link to="/wishlist" className="relative rounded-full p-2 hover:bg-ink/5" aria-label="Wishlist"><Heart size={19} strokeWidth={1.5} /><Badge n={wish} /></Link>
            <Link to="/account" className="hidden rounded-full p-2 hover:bg-ink/5 sm:block" aria-label="Account"><User size={19} strokeWidth={1.5} /></Link>
            <button onClick={() => setOpen(true)} className="relative rounded-full p-2 hover:bg-ink/5" aria-label="Cart"><ShoppingBag size={19} strokeWidth={1.5} /><Badge n={count} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMenu(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-bg p-6"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo />
                <button onClick={() => setMenu(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Close menu"><X size={22} /></button>
              </div>
              <nav className="flex flex-col">
                {nav.map((l, i) => (
                  <motion.div key={l.url + l.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                    <Link to={l.url} className="block border-b border-line py-4 font-heading text-2xl">{l.label}</Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6 text-sm">
                <Link to="/account" className="btn-outline">Account</Link>
                <Link to="/track" className="btn-outline">Track order</Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
