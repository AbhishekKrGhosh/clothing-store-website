import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, patch } from '../lib/api';
import { fmtDate, money } from '../lib/format';
import { Badge, Confirm, Empty, Modal, PageHeader, Pagination, Spinner, STATUS_TONE, Toggle } from '../components/ui';

export default function Customers() {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();
  const params = { page: +sp.get('page') || 1, limit: 20, q: sp.get('q') || undefined };
  const { data, isLoading } = useQuery({ queryKey: ['customers', params], queryFn: () => get('/users', params), placeholderData: (p) => p });
  const [view, setView] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { data: detail, isLoading: dl } = useQuery({ queryKey: ['customer', view], queryFn: () => get(`/users/${view}`), enabled: !!view });
  const setP = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  const refresh = () => qc.invalidateQueries({ queryKey: ['customers'] });

  const toggle = async (u, active) => { try { await patch(`/users/${u._id}`, { active }); refresh(); qc.invalidateQueries({ queryKey: ['customer', u._id] }); } catch (e) { toast.error(e.message); } };
  const remove = async () => { try { await del(`/users/${confirm}`); toast.success('Customer deleted'); setView(null); refresh(); } catch (e) { toast.error(e.message); } setConfirm(null); };

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${data?.total ?? '…'} registered customers`} />
      <div className="card">
        <div className="border-b border-line p-3">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search name, email, phone" defaultValue={params.q} onKeyDown={(e) => e.key === 'Enter' && setP('q', e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead><tr className="border-b border-line"><th className="th">Customer</th><th className="th">Phone</th><th className="th">Joined</th><th className="th">Orders</th><th className="th">Spent</th><th className="th">Status</th></tr></thead>
            <tbody>
              {isLoading && [0, 1, 2].map((i) => <tr key={i}><td colSpan={6} className="p-3"><div className="skeleton h-9" /></td></tr>)}
              {data?.items.map((u) => (
                <tr key={u._id} onClick={() => setView(u._id)} className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-canvas/50">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">{u.name[0]}</span>
                      <span><span className="block font-medium">{u.name}</span><span className="text-xs text-muted">{u.email}</span></span>
                    </div>
                  </td>
                  <td className="td text-muted">{u.phone || '—'}</td>
                  <td className="td text-muted">{fmtDate(u.createdAt)}</td>
                  <td className="td">{u.orders}</td>
                  <td className="td font-medium">{money(u.spent)}</td>
                  <td className="td"><Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !data?.items.length && <Empty icon={Users} title="No customers yet" />}
        </div>
        <Pagination page={data?.page} pages={data?.pages} onChange={(p) => setP('page', String(p))} />
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title="Customer" width="max-w-2xl">
        {dl || !detail ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-xl font-semibold text-brand">{detail.name[0]}</span>
              <div className="flex-1">
                <p className="text-lg font-semibold">{detail.name}</p>
                <p className="text-sm text-muted">{detail.email} · {detail.phone || 'no phone'}</p>
                <p className="text-xs text-muted">Joined {fmtDate(detail.createdAt)}</p>
              </div>
              <button className="btn-icon hover:!text-red-600" onClick={() => setConfirm(detail._id)}><Trash2 size={16} /></button>
            </div>
            <Toggle label="Account active" hint="Disabled customers can't sign in" checked={detail.active} onChange={(v) => toggle(detail, v)} />
            {detail.addresses?.[0] && (
              <div className="rounded-xl bg-canvas p-4 text-sm">
                <p className="label">Address</p>
                {[detail.addresses[0].line1, detail.addresses[0].line2, detail.addresses[0].city, detail.addresses[0].state, detail.addresses[0].pincode].filter(Boolean).join(', ')}
              </div>
            )}
            <div>
              <p className="label">Orders ({detail.orderList.length})</p>
              <div className="divide-y divide-line rounded-xl border border-line">
                {detail.orderList.map((o) => (
                  <Link key={o._id} to={`/orders/${o._id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-canvas">
                    <span className="font-medium">#{o.orderNumber}</span>
                    <span className="text-muted">{fmtDate(o.createdAt)}</span>
                    <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                    <span className="font-medium">{money(o.total)}</span>
                  </Link>
                ))}
                {!detail.orderList.length && <p className="p-4 text-sm text-muted">No orders yet.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="Delete this customer account? Their orders are kept." />
    </div>
  );
}
