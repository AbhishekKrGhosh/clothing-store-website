import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { useSite } from '../context/SiteContext';
import Img from './Img';

function useDebounced(v, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setD(v), ms);
    return () => clearTimeout(id);
  }, [v, ms]);
  return d;
}

export default function SearchOverlay({ open, onClose }) {
  const { t, fmt, categories } = useSite();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const nav = useNavigate();
  const input = useRef(null);

  const { data, isFetching } = useQuery({
    queryKey: ['search', dq],
    queryFn: () => get('/products', { q: dq, limit: 6 }),
    enabled: open && dq.length > 1,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => input.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else document.body.style.overflow = '';
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative max-h-[85vh] overflow-y-auto bg-bg shadow-xl"
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="container py-5 md:py-8">
              <form onSubmit={submit} className="flex items-center gap-3 border-b border-ink/20 pb-3">
                <Search size={22} strokeWidth={1.4} className="text-muted" />
                <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} className="flex-1 bg-transparent font-heading text-2xl placeholder:text-muted/60 md:text-3xl" />
                <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-ink/5" aria-label="Close search"><X size={22} /></button>
              </form>

              {dq.length < 2 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {categories.slice(0, 8).map((c) => (
                    <Link key={c._id} to={c.link || `/shop?category=${c.slug}`} onClick={onClose} className="chip border-line bg-surface hover:border-ink">{c.name}</Link>
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  {isFetching && !data && <p className="text-sm text-muted">Searching…</p>}
                  {data && data.items.length === 0 && <p className="text-sm text-muted">No results for “{dq}”.</p>}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {data?.items.map((p) => (
                      <Link key={p._id} to={`/product/${p.slug}`} onClick={onClose} className="group">
                        <Img image={p.images?.[0]} className="aspect-[4/5] w-full rounded-brand" sizes="200px" maxWidth={480} imgClassName="group-hover:scale-105" />
                        <p className="mt-2 truncate text-sm">{p.name}</p>
                        <p className="text-xs text-muted">{fmt(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                  {data?.total > 6 && (
                    <button onClick={submit} className="link-arrow mt-6">See all {data.total} results <ArrowRight size={15} /></button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
