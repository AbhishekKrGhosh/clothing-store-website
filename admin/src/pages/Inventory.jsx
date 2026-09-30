import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, patch } from '../lib/api';
import Img from '../components/Img';
import { Badge, PageHeader, Pagination } from '../components/ui';

export default function Inventory() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [stock, setStock] = useState('');
  const [edits, setEdits] = useState({});
  const params = { all: 1, limit: 25, page, q: q || undefined, stock: stock || undefined, sort: 'name' };
  const { data, isLoading } = useQuery({ queryKey: ['inventory', params], queryFn: () => get('/products', params), placeholderData: (p) => p });

  const val = (p, label) => edits[p._id]?.[label] ?? p.sizes.find((s) => s.label === label)?.stock ?? 0;
  const setVal = (p, label, v) => setEdits((e) => ({ ...e, [p._id]: { ...(e[p._id] || {}), [label]: v } }));
  const save = async (p) => {
    const sizes = p.sizes.map((s) => ({ label: s.label, stock: Math.max(0, +val(p, s.label) || 0) }));
    try {
      await patch(`/products/${p._id}`, { sizes });
      toast.success(`${p.name} updated`);
      setEdits((e) => { const n = { ...e }; delete n[p._id]; return n; });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Update stock per size. Changes save per product." />
      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search products" onKeyDown={(e) => { if (e.key === 'Enter') { setQ(e.target.value); setPage(1); } }} />
          </div>
          <select className="input w-auto" value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }}>
            <option value="">All</option><option value="low">Low stock</option><option value="out">Out of stock</option>
          </select>
        </div>
        <div className="divide-y divide-line">
          {isLoading && <div className="skeleton m-4 h-40" />}
          {data?.items.map((p) => {
            const total = p.sizes.reduce((s, x) => s + (+val(p, x.label) || 0), 0);
            return (
              <div key={p._id} className="flex flex-wrap items-center gap-4 p-4">
                <Link to={`/products/${p._id}`} className="flex w-64 items-center gap-3">
                  <Img image={p.images?.[0]} className="h-12 w-10 shrink-0 rounded-md" sizes="40px" maxWidth={160} />
                  <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted">{p.sku}</span></span>
                </Link>
                <div className="flex flex-1 flex-wrap gap-2">
                  {p.sizes.length ? p.sizes.map((s) => {
                    const v = val(p, s.label);
                    return (
                      <label key={s.label} className={`flex items-center overflow-hidden rounded-lg border ${+v === 0 ? 'border-red-200 bg-red-50' : +v <= 5 ? 'border-amber-200 bg-amber-50' : 'border-line bg-white'}`}>
                        <span className="px-2 text-xs text-muted">{s.label}</span>
                        <input type="number" min="0" value={v} onChange={(e) => setVal(p, s.label, e.target.value)} className="w-14 border-l border-line bg-white px-2 py-1.5 text-sm" />
                      </label>
                    );
                  }) : <span className="text-xs text-muted">No sizes (unlimited)</span>}
                </div>
                <Badge tone={total === 0 ? 'red' : total <= 5 ? 'amber' : 'green'}>{total} total</Badge>
                <button disabled={!edits[p._id]} onClick={() => save(p)} className="btn-primary py-1.5">Save</button>
              </div>
            );
          })}
        </div>
        <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
      </div>
    </div>
  );
}
