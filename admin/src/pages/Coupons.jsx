import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, post, put } from '../lib/api';
import { fmtDate, money } from '../lib/format';
import { Badge, Confirm, Empty, Input, Modal, PageHeader, Select, Toggle } from '../components/ui';

const EMPTY = { code: '', description: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, startsAt: '', expiresAt: '', active: true, showOnSite: false };
const d = (v) => (v ? String(v).slice(0, 10) : '');

export default function Coupons() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: () => get('/coupons') });
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['coupons'] });
  const save = async () => {
    if (!edit.code.trim()) return toast.error('Code is required');
    try {
      const body = { ...edit, value: +edit.value, minOrder: +edit.minOrder, maxDiscount: +edit.maxDiscount, usageLimit: +edit.usageLimit };
      if (edit._id) await put(`/coupons/${edit._id}`, body); else await post('/coupons', body);
      toast.success('Coupon saved'); setEdit(null); refresh();
    } catch (e) { toast.error(e.message); }
  };
  const remove = async () => { await del(`/coupons/${confirm}`); toast.success('Deleted'); setConfirm(null); refresh(); };
  const status = (c) => {
    if (!c.active) return ['gray', 'Inactive'];
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return ['red', 'Expired'];
    if (c.usageLimit && c.used >= c.usageLimit) return ['amber', 'Used up'];
    return ['green', 'Active'];
  };

  return (
    <div>
      <PageHeader title="Offers & Coupons" subtitle="Discount codes shoppers can apply at checkout.">
        <button className="btn-primary" onClick={() => setEdit({ ...EMPTY })}><Plus size={16} /> New coupon</button>
      </PageHeader>
      {isLoading ? <div className="skeleton h-48" /> : !data?.length ? <div className="card"><Empty icon={TicketPercent} title="No coupons yet" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => {
            const [tone, label] = status(c);
            return (
              <div key={c._id} className="card relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-light" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-mono text-lg font-semibold tracking-wider">{c.code}</p>
                    <p className="text-sm text-muted">{c.description}</p>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <p className="relative mt-4 text-2xl font-semibold text-brand">{c.type === 'percent' ? `${c.value}% off` : `${money(c.value)} off`}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {c.minOrder > 0 && <span>Min {money(c.minOrder)}</span>}
                  {c.maxDiscount > 0 && <span>Max {money(c.maxDiscount)}</span>}
                  <span>Used {c.used}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
                  {c.expiresAt && <span>Ends {fmtDate(c.expiresAt)}</span>}
                  {c.showOnSite && <span className="text-brand">Shown at checkout</span>}
                </div>
                <div className="mt-4 flex justify-end gap-1 border-t border-line pt-3">
                  <button className="btn-icon" onClick={() => setEdit({ ...EMPTY, ...c, startsAt: d(c.startsAt), expiresAt: d(c.expiresAt) })}><Pencil size={15} /></button>
                  <button className="btn-icon hover:!text-red-600" onClick={() => setConfirm(c._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit coupon' : 'New coupon'}
        footer={<><button className="btn-light" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Code *" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} />
            <Select label="Type" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })} options={[{ value: 'percent', label: 'Percentage' }, { value: 'flat', label: 'Flat amount' }]} />
            <Input label="Description" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="sm:col-span-2" />
            <Input label={edit.type === 'percent' ? 'Percent off' : 'Amount off'} type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
            <Input label="Minimum order" type="number" value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: e.target.value })} />
            <Input label="Max discount (0 = none)" type="number" value={edit.maxDiscount} onChange={(e) => setEdit({ ...edit, maxDiscount: e.target.value })} />
            <Input label="Usage limit (0 = unlimited)" type="number" value={edit.usageLimit} onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value })} />
            <Input label="Starts" type="date" value={edit.startsAt} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })} />
            <Input label="Expires" type="date" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} />
            <div className="space-y-3 sm:col-span-2">
              <Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
              <Toggle label="Suggest at checkout" hint="Listed under “Have a coupon code?” on the cart" checked={edit.showOnSite} onChange={(v) => setEdit({ ...edit, showOnSite: v })} />
            </div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="Delete this coupon?" />
    </div>
  );
}
