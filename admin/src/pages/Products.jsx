import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Package, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, patch, post } from '../lib/api';
import { money } from '../lib/format';
import Img from '../components/Img';
import { Badge, Confirm, Empty, PageHeader, Pagination, Toggle } from '../components/ui';
import { STORE_URL } from '../components/Layout';

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sel, setSel] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const params = { all: 1, limit: 20, page: +sp.get('page') || 1, q: sp.get('q') || undefined, category: sp.get('category') || undefined, status: sp.get('status') || undefined, stock: sp.get('stock') || undefined, sort: sp.get('sort') || 'new' };
  const { data, isLoading } = useQuery({ queryKey: ['admin-products', params], queryFn: () => get('/products', params), placeholderData: (p) => p });
  const { data: cats } = useQuery({ queryKey: ['categories-all'], queryFn: () => get('/categories', { all: 1 }) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-products'] });

  const setP = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  const quick = useMutation({ mutationFn: ({ id, ...body }) => patch(`/products/${id}`, body), onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const bulk = async (action) => {
    try { await post('/products/bulk', { ids: sel, action }); toast.success('Done'); setSel([]); refresh(); } catch (e) { toast.error(e.message); }
  };
  const remove = async () => {
    try { await del(`/products/${confirm}`); toast.success('Product deleted'); refresh(); } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };
  const dup = async (id) => { try { const p = await post(`/products/${id}/duplicate`); toast.success('Duplicated (inactive)'); nav(`/products/${p._id}`); } catch (e) { toast.error(e.message); } };

  const items = data?.items || [];
  const allSel = items.length > 0 && items.every((p) => sel.includes(p._id));

  return (
    <div>
      <PageHeader title="Products" subtitle={`${data?.total ?? '…'} products in your catalogue`}>
        <Link to="/products/new" className="btn-primary"><Plus size={16} /> Add product</Link>
      </PageHeader>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search name, SKU, tag…" defaultValue={params.q} onKeyDown={(e) => e.key === 'Enter' && setP('q', e.target.value)} />
          </div>
          <select className="input w-auto" value={params.category || ''} onChange={(e) => setP('category', e.target.value)}>
            <option value="">All categories</option>
            {cats?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input w-auto" value={params.status || ''} onChange={(e) => setP('status', e.target.value)}>
            <option value="">Any status</option><option value="active">Active</option><option value="inactive">Hidden</option>
          </select>
          <select className="input w-auto" value={params.stock || ''} onChange={(e) => setP('stock', e.target.value)}>
            <option value="">Any stock</option><option value="low">Low stock</option><option value="out">Out of stock</option>
          </select>
          <select className="input w-auto" value={params.sort} onChange={(e) => setP('sort', e.target.value)}>
            <option value="new">Newest</option><option value="default">Display order</option><option value="name">Name</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option><option value="popular">Best selling</option>
          </select>
        </div>

        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-light/50 px-4 py-2 text-sm">
            <span className="mr-2 font-medium">{sel.length} selected</span>
            {[['activate', 'Show'], ['deactivate', 'Hide'], ['feature', 'Feature'], ['unfeature', 'Unfeature'], ['markNew', 'Mark new'], ['unmarkNew', 'Unmark new']].map(([a, l]) => (
              <button key={a} onClick={() => bulk(a)} className="btn-light py-1 text-xs">{l}</button>
            ))}
            <button onClick={() => bulk('delete')} className="btn-light py-1 text-xs text-red-600">Delete</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th w-10"><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? [] : items.map((p) => p._id))} className="accent-brand" /></th>
                <th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Visible</th><th className="th">Featured</th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3, 4].map((i) => <tr key={i}><td colSpan={8} className="p-3"><div className="skeleton h-10" /></td></tr>)}
              {items.map((p) => {
                const stock = (p.sizes || []).reduce((s, x) => s + x.stock, 0);
                return (
                  <tr key={p._id} className="border-b border-line/60 last:border-0 hover:bg-canvas/50">
                    <td className="td"><input type="checkbox" checked={sel.includes(p._id)} onChange={() => setSel((s) => (s.includes(p._id) ? s.filter((x) => x !== p._id) : [...s, p._id]))} className="accent-brand" /></td>
                    <td className="td">
                      <Link to={`/products/${p._id}`} className="flex items-center gap-3">
                        <Img image={p.images?.[0]} className="h-12 w-10 shrink-0 rounded-md" sizes="40px" maxWidth={160} />
                        <span>
                          <span className="block font-medium hover:text-brand">{p.name}</span>
                          <span className="flex gap-1.5 text-xs text-muted">{p.sku}{p.brand && ` · ${p.brand.name}`}{p.newArrival && <Badge tone="blue">New</Badge>}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="td text-muted">{p.category?.name || '—'} <span className="block text-[11px]">{p.gender}</span></td>
                    <td className="td">{money(p.price)}{p.comparePrice > p.price && <span className="block text-xs text-muted line-through">{money(p.comparePrice)}</span>}</td>
                    <td className="td">{p.sizes?.length ? <Badge tone={stock === 0 ? 'red' : stock <= 5 ? 'amber' : 'green'}>{stock} in stock</Badge> : <span className="text-muted">—</span>}</td>
                    <td className="td"><Toggle checked={p.active} onChange={(v) => quick.mutate({ id: p._id, active: v })} /></td>
                    <td className="td">
                      <button onClick={() => quick.mutate({ id: p._id, featured: !p.featured })} className="btn-icon" title="Toggle featured">
                        <Star size={16} className={p.featured ? 'fill-amber-400 text-amber-400' : ''} />
                      </button>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-0.5">
                        <a href={`${STORE_URL.replace(/\/$/, '')}/product/${p.slug}`} target="_blank" rel="noreferrer" className="btn-icon" title="View on store"><ExternalLink size={15} /></a>
                        <button className="btn-icon" title="Duplicate" onClick={() => dup(p._id)}><Copy size={15} /></button>
                        <Link to={`/products/${p._id}`} className="btn-icon" title="Edit"><Pencil size={15} /></Link>
                        <button className="btn-icon hover:!text-red-600" title="Delete" onClick={() => setConfirm(p._id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && !items.length && <Empty icon={Package} title="No products found" text="Try a different filter or add your first product."><Link to="/products/new" className="btn-primary">Add product</Link></Empty>}
        </div>
        <Pagination page={data?.page} pages={data?.pages} onChange={(p) => setP('page', String(p))} />
      </div>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="This will permanently delete the product and its reviews." />
    </div>
  );
}
