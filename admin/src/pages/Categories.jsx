import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, FolderTree, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, post, put } from '../lib/api';
import Img from '../components/Img';
import { Badge, Confirm, Empty, Input, Modal, PageHeader, Textarea, Toggle } from '../components/ui';
import { ImageField } from '../components/ImageUpload';

const EMPTY = { name: '', slug: '', description: '', link: '', image: null, banner: null, active: true, showOnHome: true, showInFilters: true };

export default function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['categories-all'], queryFn: () => get('/categories', { all: 1 }) });
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['categories-all'] });

  const save = async () => {
    if (!edit.name.trim()) return toast.error('Name is required');
    setBusy(true);
    try {
      const body = { ...edit };
      if (edit._id) await put(`/categories/${edit._id}`, body);
      else await post('/categories', { ...body, order: data?.length || 0 });
      toast.success('Category saved');
      setEdit(null);
      refresh();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const move = async (i, d) => {
    const arr = [...data];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    qc.setQueryData(['categories-all'], arr);
    await put('/categories/reorder', { ids: arr.map((c) => c._id) });
    refresh();
  };
  const remove = async () => {
    try { await del(`/categories/${confirm}`); toast.success('Deleted'); refresh(); } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise products. Order here controls the order on the home page and shop chips.">
        <button className="btn-primary" onClick={() => setEdit({ ...EMPTY })}><Plus size={16} /> Add category</button>
      </PageHeader>
      {isLoading ? <div className="skeleton h-64" /> : !data?.length ? (
        <div className="card"><Empty icon={FolderTree} title="No categories yet" /></div>
      ) : (
        <div className="card divide-y divide-line">
          {data.map((c, i) => (
            <motion.div layout key={c._id} className="flex items-center gap-4 p-3 pr-4">
              <div className="flex flex-col">
                <button className="btn-icon h-6 w-6" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={13} /></button>
                <button className="btn-icon h-6 w-6" disabled={i === data.length - 1} onClick={() => move(i, 1)}><ArrowDown size={13} /></button>
              </div>
              <Img image={c.image} className="h-16 w-14 shrink-0 rounded-lg" sizes="56px" maxWidth={160} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {c.name}
                  {!c.active && <Badge tone="red">Hidden</Badge>}
                  {c.showOnHome && <Badge tone="green">Home</Badge>}
                  {c.link && <Badge tone="violet"><Link2 size={10} className="mr-1" />Custom link</Badge>}
                </p>
                <p className="truncate text-xs text-muted">{c.link || `/shop?category=${c.slug}`} · {c.productCount} products</p>
              </div>
              <button className="btn-icon" onClick={() => setEdit({ ...EMPTY, ...c })}><Pencil size={15} /></button>
              <button className="btn-icon hover:!text-red-600" onClick={() => setConfirm(c._id)}><Trash2 size={15} /></button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit category' : 'New category'} width="max-w-2xl"
        footer={<><button className="btn-light" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
        {edit && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Input label="Name *" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <Input label="Slug" hint="Auto-generated if blank" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
              <Textarea label="Description" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              <Input label="Custom link (optional)" placeholder="/shop?gender=Women" hint="Use for tiles like “New Arrivals” or “Women” that point to a filter instead of a real category" value={edit.link} onChange={(e) => setEdit({ ...edit, link: e.target.value })} />
              <Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
              <Toggle label="Show on home page" checked={edit.showOnHome} onChange={(v) => setEdit({ ...edit, showOnHome: v })} />
              <Toggle label="Show as shop filter" checked={edit.showInFilters} onChange={(v) => setEdit({ ...edit, showInFilters: v })} />
            </div>
            <div className="space-y-4">
              <ImageField label="Tile image" value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} preset="category" aspect="aspect-[4/5]" />
              <ImageField label="Banner (category page header)" value={edit.banner} onChange={(v) => setEdit({ ...edit, banner: v })} preset="banner" aspect="aspect-[16/6]" />
            </div>
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="Delete this category? Categories with products can't be deleted." />
    </div>
  );
}
