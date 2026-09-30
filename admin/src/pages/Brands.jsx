import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, post, put } from '../lib/api';
import Img from '../components/Img';
import { Badge, Confirm, Empty, Input, Modal, PageHeader, Textarea, Toggle } from '../components/ui';
import { ImageField } from '../components/ImageUpload';

const EMPTY = { name: '', slug: '', description: '', logo: null, active: true, order: 0 };

export default function Brands() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['brands-all'], queryFn: () => get('/brands', { all: 1 }) });
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['brands-all'] });

  const save = async () => {
    if (!edit.name.trim()) return toast.error('Name is required');
    try {
      if (edit._id) await put(`/brands/${edit._id}`, edit); else await post('/brands', edit);
      toast.success('Brand saved'); setEdit(null); refresh();
    } catch (e) { toast.error(e.message); }
  };
  const remove = async () => { try { await del(`/brands/${confirm}`); toast.success('Deleted'); refresh(); } catch (e) { toast.error(e.message); } setConfirm(null); };

  return (
    <div>
      <PageHeader title="Brands" subtitle="Labels or product lines — shoppers can filter by brand.">
        <button className="btn-primary" onClick={() => setEdit({ ...EMPTY })}><Plus size={16} /> Add brand</button>
      </PageHeader>
      {isLoading ? <div className="skeleton h-48" /> : !data?.length ? <div className="card"><Empty icon={Tag} title="No brands yet" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((b) => (
            <div key={b._id} className="card flex items-start gap-4 p-4">
              {b.logo ? <Img image={b.logo} fit="contain" className="h-14 w-14 shrink-0 rounded-lg" sizes="56px" maxWidth={160} /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-canvas font-serif text-xl">{b.name[0]}</span>}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{b.name} {!b.active && <Badge tone="red">Hidden</Badge>}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{b.description}</p>
                <p className="mt-1 text-xs text-muted">{b.productCount} products</p>
              </div>
              <div className="flex flex-col">
                <button className="btn-icon" onClick={() => setEdit({ ...EMPTY, ...b })}><Pencil size={15} /></button>
                <button className="btn-icon hover:!text-red-600" onClick={() => setConfirm(b._id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit brand' : 'New brand'}
        footer={<><button className="btn-light" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <div className="space-y-4">
            <Input label="Name *" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Textarea label="Description" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <Input label="Order" type="number" value={edit.order} onChange={(e) => setEdit({ ...edit, order: +e.target.value })} />
            <ImageField label="Logo" value={edit.logo} onChange={(v) => setEdit({ ...edit, logo: v })} preset="logo" aspect="aspect-[3/1]" />
            <Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="Products of this brand will be left without a brand." />
    </div>
  );
}
