import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { del, get } from '../lib/api';
import { fmtDate } from '../lib/format';
import { Empty, PageHeader } from '../components/ui';

export default function Subscribers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['subscribers'], queryFn: () => get('/subscribers') });
  const download = async () => {
    const r = await api.get('/subscribers', { params: { format: 'csv' }, responseType: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'subscribers.csv'; a.click();
  };
  const remove = async (id) => { await del(`/subscribers/${id}`); toast.success('Removed'); qc.invalidateQueries({ queryKey: ['subscribers'] }); };
  return (
    <div>
      <PageHeader title="Subscribers" subtitle={`${data?.length ?? '…'} newsletter subscribers`}>
        <button className="btn-light" onClick={download}><Download size={15} /> Export CSV</button>
      </PageHeader>
      <div className="card divide-y divide-line">
        {isLoading && <div className="skeleton m-4 h-24" />}
        {data?.map((s) => (
          <div key={s._id} className="flex items-center gap-3 px-4 py-3">
            <Mail size={16} className="text-muted" />
            <span className="flex-1 text-sm">{s.email}</span>
            <span className="text-xs text-muted">{fmtDate(s.createdAt)}</span>
            <button className="btn-icon hover:!text-red-600" onClick={() => remove(s._id)}><Trash2 size={15} /></button>
          </div>
        ))}
        {!isLoading && !data?.length && <Empty icon={Mail} title="No subscribers yet" />}
      </div>
    </div>
  );
}
