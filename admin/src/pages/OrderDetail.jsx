import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, MapPin, Phone, Printer, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, patch } from '../lib/api';
import { fmtDateTime, money } from '../lib/format';
import Img from '../components/Img';
import { Badge, Card, Confirm, Spinner, STATUS_HEX, STATUS_TONE } from '../components/ui';

const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: o, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => get(`/orders/${id}`) });
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (isLoading || !o) return <div className="flex justify-center py-24"><Spinner /></div>;

  const update = async (body) => {
    setBusy(true);
    try {
      await patch(`/orders/${id}`, body);
      toast.success('Order updated');
      setNote('');
      setStatus('');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['badges'] });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async () => { await del(`/orders/${id}`); toast.success('Order deleted'); nav('/orders'); };
  const a = o.shippingAddress || {};

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/orders" className="btn-icon"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-3 text-2xl font-semibold">#{o.orderNumber} <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></h1>
          <p className="text-sm text-muted">Placed {fmtDateTime(o.createdAt)}</p>
        </div>
        <button onClick={() => window.print()} className="btn-light"><Printer size={15} /> Print</button>
        <button onClick={() => setConfirm(true)} className="btn-light text-red-600"><Trash2 size={15} /></button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr,360px]">
        <div className="space-y-5">
          <Card title={`Items (${o.items.reduce((s, i) => s + i.qty, 0)})`} bodyClass="divide-y divide-line">
            {o.items.map((i, k) => (
              <div key={k} className="flex items-center gap-4 px-5 py-4">
                <Img image={i.image} className="h-16 w-14 shrink-0 rounded-lg" sizes="56px" maxWidth={160} />
                <div className="min-w-0 flex-1">
                  {i.product ? <Link to={`/products/${i.product}`} className="font-medium hover:text-brand">{i.name}</Link> : <p className="font-medium">{i.name}</p>}
                  <p className="text-xs text-muted">{[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(' · ')}</p>
                </div>
                <p className="text-sm text-muted">{money(i.price)} × {i.qty}</p>
                <p className="w-24 text-right font-medium">{money(i.price * i.qty)}</p>
              </div>
            ))}
            <div className="space-y-1.5 px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{money(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount ({o.couponCode})</span><span>− {money(o.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{money(o.shipping)}</span></div>
              {o.tax > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span>{money(o.tax)}</span></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total</span><span>{money(o.total)}</span></div>
            </div>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-6">
              {[...(o.statusHistory || [])].reverse().map((h, k) => (
                <li key={k} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white" style={{ background: STATUS_HEX[h.status] || '#999' }} />
                  <p className="text-sm font-medium">{h.status}</p>
                  <p className="text-xs text-muted">{fmtDateTime(h.at)}{h.note && ` · ${h.note}`}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Update status">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} type="button" disabled={s === o.status} onClick={() => setStatus(s)}
                    className={`rounded-lg border px-2 py-2 text-xs transition ${status === s ? 'border-brand bg-brand-light text-brand' : s === o.status ? 'border-line bg-canvas text-muted' : 'border-line hover:border-muted'}`}>{s}</button>
                ))}
              </div>
              <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button disabled={!status || busy} onClick={() => update({ status, note })} className="btn-primary w-full">{status ? `Mark as ${status}` : 'Choose a status'}</button>
              {status === 'Cancelled' && <p className="text-xs text-amber-700">Cancelling returns the items to stock.</p>}
            </div>
          </Card>
          <Card title="Payment & shipping">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted">Method</span><span>{o.paymentMethod}</span></div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Payment</span>
                <select className="rounded-lg border border-line px-2 py-1 text-xs" value={o.paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value })}>
                  {['Pending', 'Paid', 'Refunded'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tracking number</label>
                <div className="flex gap-2">
                  <input className="input" defaultValue={o.trackingNumber} id="trk" />
                  <button className="btn-light" onClick={() => update({ trackingNumber: document.getElementById('trk').value })}>Save</button>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Customer">
            <div className="space-y-2.5 text-sm">
              <p className="font-medium">{o.customer.name}{o.user && <Badge tone="blue">Registered</Badge>}</p>
              <p className="flex items-center gap-2 text-muted"><Mail size={14} /><a href={`mailto:${o.customer.email}`} className="hover:text-brand">{o.customer.email}</a></p>
              <p className="flex items-center gap-2 text-muted"><Phone size={14} /><a href={`tel:${o.customer.phone}`} className="hover:text-brand">{o.customer.phone}</a></p>
              <p className="flex items-start gap-2 text-muted"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{[a.line1, a.line2, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ')}</span></p>
              {o.notes && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">“{o.notes}”</p>}
            </div>
          </Card>
        </div>
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} text="Delete this order permanently? Stock will not be restored." />
    </div>
  );
}
