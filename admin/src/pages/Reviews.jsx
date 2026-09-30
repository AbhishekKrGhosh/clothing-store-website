import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MessageSquare, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, patch } from '../lib/api';
import { fmtDate } from '../lib/format';
import Img from '../components/Img';
import { Badge, Empty, PageHeader, Pagination, Tabs } from '../components/ui';

export default function Reviews() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const params = { status: status === 'all' ? undefined : status, page, limit: 20 };
  const { data, isLoading } = useQuery({ queryKey: ['reviews', params], queryFn: () => get('/reviews', params), placeholderData: (p) => p });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['reviews'] }); qc.invalidateQueries({ queryKey: ['review-badge'] }); };
  const act = async (fn, msg) => { try { await fn(); toast.success(msg); refresh(); } catch (e) { toast.error(e.message); } };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Approve reviews before they appear on product pages." />
      <Tabs tabs={[['pending', `Pending (${data?.pending ?? 0})`], ['approved', 'Approved'], ['all', 'All']]} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <div className="card divide-y divide-line">
        {isLoading && <div className="skeleton m-4 h-32" />}
        {data?.items.map((r) => (
          <div key={r._id} className="flex flex-col gap-4 p-4 sm:flex-row">
            {r.product && (
              <Link to={`/products/${r.product._id}`} className="flex w-full shrink-0 items-center gap-3 sm:w-52">
                <Img image={r.product.images?.[0]} className="h-12 w-10 shrink-0 rounded-md" sizes="40px" maxWidth={160} />
                <span className="truncate text-sm font-medium">{r.product.name}</span>
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />)}</span>
                <span className="text-sm font-medium">{r.name}</span>
                <span className="text-xs text-muted">{r.email} · {fmtDate(r.createdAt)}</span>
                <Badge tone={r.approved ? 'green' : 'amber'}>{r.approved ? 'Approved' : 'Pending'}</Badge>
              </div>
              {r.title && <p className="mt-1.5 font-medium">{r.title}</p>}
              {r.comment && <p className="mt-0.5 text-sm text-muted">{r.comment}</p>}
            </div>
            <div className="flex shrink-0 items-start gap-1">
              {r.approved
                ? <button className="btn-light py-1.5 text-xs" onClick={() => act(() => patch(`/reviews/${r._id}`, { approved: false }), 'Review hidden')}><X size={14} /> Hide</button>
                : <button className="btn-primary py-1.5 text-xs" onClick={() => act(() => patch(`/reviews/${r._id}`, { approved: true }), 'Review approved')}><Check size={14} /> Approve</button>}
              <button className="btn-icon hover:!text-red-600" onClick={() => act(() => del(`/reviews/${r._id}`), 'Review deleted')}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {!isLoading && !data?.items.length && <Empty icon={MessageSquare} title="Nothing here" text={status === 'pending' ? 'No reviews waiting for approval.' : 'No reviews yet.'} />}
        <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
      </div>
    </div>
  );
}
