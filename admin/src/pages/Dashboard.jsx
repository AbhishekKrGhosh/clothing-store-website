import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark, ShoppingBag, Star, Users } from 'lucide-react';
import { get } from '../lib/api';
import { money, fmtDate } from '../lib/format';
import Img from '../components/Img';
import { Badge, Card, STATUS_HEX, STATUS_TONE } from '../components/ui';

const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 12 months']];
const compact = (n) => (n >= 100000 ? `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L` : n >= 1000 ? `${Math.round(n / 1000)}K` : n);

function Stat({ icon: I, label, value, change, tint, i }) {
  const up = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}><I size={20} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
      <span className={`flex items-center text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{up ? '+' : ''}{change}{label === 'Average Rating' ? '' : '%'}
      </span>
    </motion.div>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [months, setMonths] = useState(6);
  const { data, isLoading } = useQuery({ queryKey: ['dashboard', days, months], queryFn: () => get('/dashboard', { days, months }), placeholderData: (p) => p });

  if (isLoading || !data) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}<div className="skeleton h-72 md:col-span-2 xl:col-span-4" /></div>;
  }
  const c = data.cards;
  const pie = Object.entries(data.statusCounts).filter(([k]) => k !== 'Cancelled' || data.statusCounts[k] > 0).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Here’s what’s happening with your store today.</p>
        </div>
        <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}>
          {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat i={0} icon={Landmark} label="Total Revenue" value={money(c.revenue.value)} change={c.revenue.change} tint="bg-sky-50 text-sky-600" />
        <Stat i={1} icon={ShoppingBag} label="Total Orders" value={c.orders.value} change={c.orders.change} tint="bg-emerald-50 text-emerald-600" />
        <Stat i={2} icon={Users} label="Total Customers" value={c.customers.value} change={c.customers.change} tint="bg-indigo-50 text-indigo-600" />
        <Stat i={3} icon={Star} label="Average Rating" value={c.rating.value || '–'} change={c.rating.change} tint="bg-amber-50 text-amber-500" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr,1fr,1fr]">
        <Card title="Sales Overview" actions={
          <select className="rounded-lg border border-line px-2 py-1 text-xs" value={months} onChange={(e) => setMonths(+e.target.value)}>
            {[3, 6, 12].map((m) => <option key={m} value={m}>Last {m} months</option>)}
          </select>
        }>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesOverview} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E9E6A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2E9E6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEE" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8279' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: '#8a8279' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => (n === 'revenue' ? money(v) : v)} contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2E9E6A" strokeWidth={2} fill="url(#g)" dot={{ r: 3, fill: '#2E9E6A' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Order Status">
          <div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={58} outerRadius={78} paddingAngle={2} stroke="none">
                    {pie.map((p) => <Cell key={p.name} fill={STATUS_HEX[p.name]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{data.totalOrdersInRange}</span>
                <span className="text-[11px] text-muted">Total Orders</span>
              </div>
            </div>
            <ul className="w-full space-y-2.5">
              {pie.map((p) => (
                <li key={p.name}>
                  <Link to={`/orders?status=${p.name}`} className="flex items-center gap-2 text-sm hover:text-brand">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_HEX[p.name] }} />
                    <span className="flex-1 text-muted">{p.name}</span><span className="font-medium">{p.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Top Products" bodyClass="p-3">
          <ul>
            {data.topProducts.map((p) => (
              <li key={p._id}>
                <Link to={`/products/${p._id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-canvas">
                  <Img image={p.image} className="h-10 w-9 shrink-0 rounded-md" sizes="40px" maxWidth={160} />
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-sm font-medium">{p.qty}</span>
                </Link>
              </li>
            ))}
            {!data.topProducts.length && <p className="p-4 text-sm text-muted">No sales yet.</p>}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <Card title="Recent Orders" actions={<Link to="/orders" className="text-xs text-brand hover:underline">View all</Link>} bodyClass="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b border-line"><th className="th">Order</th><th className="th">Customer</th><th className="th">Date</th><th className="th">Status</th><th className="th text-right">Total</th></tr></thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o._id} className="border-b border-line/60 last:border-0 hover:bg-canvas/60">
                  <td className="td"><Link to={`/orders/${o._id}`} className="font-medium hover:text-brand">#{o.orderNumber}</Link></td>
                  <td className="td">{o.customer?.name}</td>
                  <td className="td text-muted">{fmtDate(o.createdAt)}</td>
                  <td className="td"><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></td>
                  <td className="td text-right font-medium">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.recentOrders.length && <p className="p-6 text-center text-sm text-muted">No orders yet.</p>}
        </Card>
        <Card title="Low Stock" subtitle="Products at or below your low-stock threshold" actions={<Link to="/inventory" className="text-xs text-brand hover:underline">Inventory</Link>} bodyClass="p-3">
          {data.lowStock.length === 0 ? <p className="p-4 text-sm text-muted">All products are well stocked. 🎉</p> : (
            <ul>
              {data.lowStock.map((p) => (
                <li key={p._id}>
                  <Link to={`/products/${p._id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-canvas">
                    <Img image={p.image} className="h-10 w-9 shrink-0 rounded-md" sizes="40px" maxWidth={160} />
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle size={13} />{p.stock} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
