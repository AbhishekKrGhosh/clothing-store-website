import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart } from 'lucide-react';
import { get } from '../lib/api';
import { fmtDateTime, money } from '../lib/format';
import { Badge, Empty, PageHeader, Pagination, STATUS_TONE } from '../components/ui';

const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const params = { page: +sp.get('page') || 1, limit: 20, status: sp.get('status') || undefined, q: sp.get('q') || undefined, from: sp.get('from') || undefined, to: sp.get('to') || undefined };
  const { data, isLoading } = useQuery({ queryKey: ['orders', params], queryFn: () => get('/orders', params), placeholderData: (p) => p });
  const setP = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  const counts = data?.counts || {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  const exportCsv = () => {
    const rows = [['Order', 'Date', 'Customer', 'Email', 'Phone', 'City', 'Items', 'Total', 'Status'], ...(data?.items || []).map((o) => [o.orderNumber, new Date(o.createdAt).toISOString(), o.customer.name, o.customer.email, o.customer.phone, o.shippingAddress?.city, o.items.reduce((s, i) => s + i.qty, 0), o.total, o.status])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and fulfil customer orders">
        <button onClick={exportCsv} className="btn-light">Export page CSV</button>
      </PageHeader>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[['', `All (${all})`], ...STATUSES.map((s) => [s, `${s} (${counts[s] || 0})`])].map(([v, l]) => (
          <button key={v} onClick={() => setP('status', v)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition ${(params.status || '') === v ? 'border-side bg-side text-white' : 'border-line bg-white hover:border-muted'}`}>{l}</button>
        ))}
      </div>
      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Order #, name, email, phone" defaultValue={params.q} onKeyDown={(e) => e.key === 'Enter' && setP('q', e.target.value)} />
          </div>
          <input type="date" className="input w-auto" value={params.from || ''} onChange={(e) => setP('from', e.target.value)} />
          <input type="date" className="input w-auto" value={params.to || ''} onChange={(e) => setP('to', e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead><tr className="border-b border-line"><th className="th">Order</th><th className="th">Date</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Payment</th><th className="th">Status</th><th className="th text-right">Total</th></tr></thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={7} className="p-3"><div className="skeleton h-9" /></td></tr>)}
              {data?.items.map((o) => (
                <tr key={o._id} className="border-b border-line/60 last:border-0 hover:bg-canvas/50">
                  <td className="td"><Link to={`/orders/${o._id}`} className="font-medium text-brand hover:underline">#{o.orderNumber}</Link></td>
                  <td className="td text-muted">{fmtDateTime(o.createdAt)}</td>
                  <td className="td"><span className="block">{o.customer.name}</span><span className="text-xs text-muted">{o.customer.email}</span></td>
                  <td className="td">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="td"><Badge tone={o.paymentStatus === 'Paid' ? 'green' : 'gray'}>{o.paymentMethod} · {o.paymentStatus}</Badge></td>
                  <td className="td"><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></td>
                  <td className="td text-right font-medium">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !data?.items.length && <Empty icon={ShoppingCart} title="No orders" text="Orders placed on your store will show up here." />}
        </div>
        <Pagination page={data?.page} pages={data?.pages} onChange={(p) => setP('page', String(p))} />
      </div>
    </div>
  );
}
