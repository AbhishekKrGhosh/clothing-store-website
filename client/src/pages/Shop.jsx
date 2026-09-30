import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { get } from '../lib/api';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import ProductGrid from '../components/ProductGrid';
import { GridSkeleton } from '../components/Skeleton';
import Modal from '../components/Modal';

const FILTER_KEYS = ['category', 'brand', 'gender', 'size', 'color', 'minPrice', 'maxPrice', 'q', 'featured', 'newArrival', 'bestSeller'];
const SORTS = [
  ['', 'Recommended'], ['new', 'Newest'], ['popular', 'Best selling'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['rating', 'Top rated'],
];
const toggleList = (str, v) => {
  const set = new Set((str || '').split(',').filter(Boolean));
  set.has(v) ? set.delete(v) : set.add(v);
  return [...set].join(',');
};

export default function Shop() {
  const { content, categories, brands, t, fmt } = useSite();
  const { category: catParam } = useParams();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = useMemo(() => {
    const p = {};
    FILTER_KEYS.forEach((k) => sp.get(k) && (p[k] = sp.get(k)));
    if (catParam && !p.category) p.category = catParam;
    if (sp.get('sort')) p.sort = sp.get('sort');
    return p;
  }, [sp, catParam]);

  const activeCat = categories.find((c) => c.slug === params.category);
  usePageTitle(activeCat?.name || (params.q ? `Search: ${params.q}` : content.collections.title));

  const q = useInfiniteQuery({
    queryKey: ['shop', params],
    queryFn: ({ pageParam = 1 }) => get('/products', { ...params, page: pageParam, limit: 12 }),
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    initialPageParam: 1,
  });
  const products = q.data?.pages.flatMap((p) => p.items) || [];
  const total = q.data?.pages[0]?.total ?? 0;

  // auto-load more when the sentinel scrolls into view
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage(), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    setSp(next, { replace: true });
  };

  // category chips: "All" + categories visible in filters or with custom link
  const chips = categories.filter((c) => c.showInFilters || c.link);
  const chipHref = (c) => c.link || `/shop?category=${c.slug}`;
  const chipActive = (c) => {
    if (c.link) {
      const [, qs] = c.link.split('?');
      return qs && new URLSearchParams(qs).toString().split('&').every((pair) => sp.toString().includes(pair)) && !params.category;
    }
    return params.category === c.slug;
  };
  const noneActive = !params.category && !chips.some((c) => c.link && chipActive(c));

  const activePills = [
    ...(params.gender ? params.gender.split(',').map((g) => ['gender', g, g]) : []),
    ...(params.brand ? params.brand.split(',').map((b) => ['brand', b, brands.find((x) => x.slug === b)?.name || b]) : []),
    ...(params.size ? params.size.split(',').map((s) => ['size', s, `Size ${s}`]) : []),
    ...(params.color ? params.color.split(',').map((c) => ['color', c, c]) : []),
    ...(params.minPrice || params.maxPrice ? [['price', '', `${params.minPrice ? fmt(params.minPrice) : fmt(0)} – ${params.maxPrice ? fmt(params.maxPrice) : '∞'}`]] : []),
    ...(params.q ? [['q', '', `“${params.q}”`]] : []),
    ...(params.featured ? [['featured', '', 'Featured']] : []),
  ];
  const removePill = ([k, v]) => {
    const next = new URLSearchParams(sp);
    if (k === 'price') { next.delete('minPrice'); next.delete('maxPrice'); }
    else if (v) { const nv = toggleList(next.get(k), v); nv ? next.set(k, nv) : next.delete(k); }
    else next.delete(k);
    setSp(next, { replace: true });
  };

  const header = activeCat
    ? { title: activeCat.name, subtitle: activeCat.description, image: activeCat.banner || activeCat.image }
    : { title: params.q ? `Results for “${params.q}”` : content.collections.title, subtitle: content.collections.subtitle, image: content.collections.image };

  return (
    <div>
      {/* header */}
      <section className="container pt-8 md:pt-10">
        <div className="relative grid items-center gap-6 overflow-hidden rounded-[calc(var(--radius)*1.6)] md:grid-cols-[1fr,1.1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="py-2 md:py-8">
            <h1 className="font-heading text-4xl font-medium md:text-6xl">{header.title}</h1>
            {header.subtitle && <p className="mt-2 max-w-md text-sm text-muted md:text-base">{header.subtitle}</p>}
          </motion.div>
          {header.image && (
            <motion.div initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="hidden md:block">
              <Img image={header.image} eager className="aspect-[16/6] w-full rounded-brand" sizes="55vw" />
            </motion.div>
          )}
        </div>

        {/* chips */}
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link to="/shop" className={`chip ${noneActive ? 'border-primary bg-primary text-white' : 'border-line bg-surface hover:border-ink/50'}`}>{t('all')}</Link>
          {chips.map((c) => (
            <Link key={c._id} to={chipHref(c)} className={`chip ${chipActive(c) ? 'border-primary bg-primary text-white' : 'border-line bg-surface hover:border-ink/50'}`}>{c.name}</Link>
          ))}
        </div>

        {/* toolbar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-ink/50">
              <SlidersHorizontal size={15} /> {t('filters')}
              {activePills.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">{activePills.length}</span>}
            </button>
            <span className="text-sm text-muted">{q.isLoading ? '…' : `${total} products`}</span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{t('sortBy')}</span>
            <select value={params.sort || ''} onChange={(e) => setParam('sort', e.target.value)} className="rounded-full border border-line bg-surface px-3 py-2 text-sm">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <AnimatePresence>
          {activePills.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 pt-3">
              {activePills.map((p) => (
                <button key={p.join()} onClick={() => removePill(p)} className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 text-xs hover:bg-line">
                  {p[2]} <X size={12} />
                </button>
              ))}
              <button onClick={() => setSp(params.category ? { category: params.category } : {}, { replace: true })} className="px-2 text-xs text-primary underline-offset-4 hover:underline">Clear all</button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* grid */}
      <section className="container py-8">
        {q.isLoading ? (
          <GridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-heading text-3xl">{t('noProducts')}</p>
            <Link to="/shop" className="btn-outline mt-6">Browse all</Link>
          </div>
        ) : (
          <ProductGrid products={products} eagerCount={4} />
        )}
        <div ref={sentinel} className="h-4" />
        {q.isFetchingNextPage && <GridSkeleton count={4} className="mt-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4" />}
        {q.hasNextPage && !q.isFetchingNextPage && (
          <div className="mt-10 text-center"><button className="btn-outline" onClick={() => q.fetchNextPage()}>Load more</button></div>
        )}
      </section>

      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} sp={sp} setSp={setSp} />
    </div>
  );
}

const Group = ({ title, children }) => (
  <div className="border-b border-line py-5">
    <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em]">{title}</p>
    {children}
  </div>
);
const Pill = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={`chip ${active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:border-ink/50'}`}>{children}</button>
);

function FilterPanel({ open, onClose, sp, setSp }) {
  const { brands, categories, fmt, t } = useSite();
  const { data: meta } = useQuery({ queryKey: ['filters'], queryFn: () => get('/products/filters'), enabled: open, staleTime: 300_000 });
  const [draft, setDraft] = useState(() => new URLSearchParams(sp));
  useEffect(() => { if (open) setDraft(new URLSearchParams(sp)); }, [open, sp]);

  const tog = (k, v) => {
    const n = new URLSearchParams(draft);
    const nv = toggleList(n.get(k), v);
    nv ? n.set(k, nv) : n.delete(k);
    setDraft(n);
  };
  const has = (k, v) => (draft.get(k) || '').split(',').includes(v);
  const setVal = (k, v) => {
    const n = new URLSearchParams(draft);
    v ? n.set(k, v) : n.delete(k);
    setDraft(n);
  };
  const apply = () => { setSp(draft, { replace: true }); onClose(); };

  return (
    <Modal open={open} onClose={onClose} title={t('filters')} className="max-w-xl">
      <Group title="Shop for">
        <div className="flex flex-wrap gap-2">{['Men', 'Women', 'Unisex'].map((g) => <Pill key={g} active={has('gender', g)} onClick={() => tog('gender', g)}>{g}</Pill>)}</div>
      </Group>
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {categories.filter((c) => !c.link).map((c) => <Pill key={c._id} active={draft.get('category') === c.slug} onClick={() => setVal('category', draft.get('category') === c.slug ? '' : c.slug)}>{c.name}</Pill>)}
        </div>
      </Group>
      {brands.length > 1 && (
        <Group title="Brand">
          <div className="flex flex-wrap gap-2">{brands.map((b) => <Pill key={b._id} active={has('brand', b.slug)} onClick={() => tog('brand', b.slug)}>{b.name}</Pill>)}</div>
        </Group>
      )}
      {meta?.sizes?.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">{meta.sizes.map((s) => <Pill key={s} active={has('size', s)} onClick={() => tog('size', s)}>{s}</Pill>)}</div>
        </Group>
      )}
      {meta?.colors?.length > 0 && (
        <Group title="Colour">
          <div className="flex flex-wrap gap-2">
            {meta.colors.map((c) => (
              <button key={c.name} type="button" onClick={() => tog('color', c.name)} className={`chip gap-2 ${has('color', c.name) ? 'border-ink bg-ink text-bg' : 'border-line bg-surface'}`}>
                <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c.hex }} />{c.name}
              </button>
            ))}
          </div>
        </Group>
      )}
      <Group title={`Price ${meta?.price ? `(${fmt(meta.price.min)} – ${fmt(meta.price.max)})` : ''}`}>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" min="0" placeholder="Min" value={draft.get('minPrice') || ''} onChange={(e) => setVal('minPrice', e.target.value)} />
          <input className="input" type="number" min="0" placeholder="Max" value={draft.get('maxPrice') || ''} onChange={(e) => setVal('maxPrice', e.target.value)} />
        </div>
      </Group>
      <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 bg-bg p-5 sm:-mx-7 sm:-mb-7 sm:px-7">
        <button className="btn-outline flex-1" onClick={() => setDraft(new URLSearchParams(sp.get('sort') ? { sort: sp.get('sort') } : {}))}>Reset</button>
        <button className="btn-primary flex-1" onClick={apply}>Show results</button>
      </div>
    </Modal>
  );
}
