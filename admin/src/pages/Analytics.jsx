import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../lib/api';
import { money } from '../lib/format';
import { Card, PageHeader } from '../components/ui';

const COLORS = ['#B4532A', '#2F3A2D', '#C9A27E', '#556042', '#8B6BD6', '#3B8FD9', '#E0A33A', '#2E9E6A'];
const compact = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}K` : n);

export default function Analytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({ queryKey: ['analytics', days], queryFn: () => get('/dashboard/analytics', { days }), placeholderData: (p) => p });
  if (isLoading || !data) return <div className="skeleton h-96" />;
  const t = data.totals;
  const kpis = [['Revenue', money(t.revenue)], ['Orders', t.orders], ['Avg. order value', money(t.aov)], ['Items sold', t.itemsSold], ['Discounts given', money(t.discount)], ['Cancelled', t.cancelled], ['Active products', t.products], ['Subscribers', t.subscribers]];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deeper look at how your store is performing.">
        <select className="input w-auto" value={days} onChange={(e) => setDays(+e.target.value)}>
          {[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [180, 'Last 6 months'], [365, 'Last 12 months']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 text-xl font-semibold">{v}</p></div>)}
      </div>
      <Card title="Revenue & orders" className="mt-4">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data.series} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#8a8279' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis yAxisId="l" tickFormatter={compact} tick={{ fontSize: 11, fill: '#8a8279' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#8a8279' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => (n === 'revenue' ? money(v) : v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="#B4532A" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="orders" stroke="#2F3A2D" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Sales by category">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.byCategory} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>{data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Sales by audience">
          <div className="flex h-64 items-center gap-6">
            <ResponsiveContainer width="55%">
              <PieChart><Pie data={data.byGender} dataKey="revenue" nameKey="_id" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">{data.byGender.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-sm">
              {data.byGender.map((g, i) => <li key={g._id} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} /><span className="flex-1">{g._id}</span><span className="font-medium">{money(g.revenue)}</span></li>)}
            </ul>
          </div>
        </Card>
        <Card title="Top customers" bodyClass="divide-y divide-line">
          {data.topCustomers.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span><span className="block font-medium">{c.name}</span><span className="text-xs text-muted">{c._id}</span></span>
              <span className="text-right"><span className="block font-medium">{money(c.spent)}</span><span className="text-xs text-muted">{c.orders} orders</span></span>
            </div>
          ))}
          {!data.topCustomers.length && <p className="p-5 text-sm text-muted">No data yet.</p>}
        </Card>
        <Card title="Coupon performance" bodyClass="divide-y divide-line">
          {data.coupons.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-mono font-medium">{c._id}</span>
              <span className="text-muted">{c.uses} uses</span>
              <span className="font-medium">{money(c.discount)} off</span>
            </div>
          ))}
          {!data.coupons.length && <p className="p-5 text-sm text-muted">No coupons used in this period.</p>}
        </Card>
      </div>
    </div>
  );
}
