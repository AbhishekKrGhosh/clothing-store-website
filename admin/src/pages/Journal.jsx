import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, post, put } from '../lib/api';
import { fmtDate } from '../lib/format';
import Img from '../components/Img';
import { Badge, Confirm, Empty, Input, Modal, PageHeader, Textarea, Toggle } from '../components/ui';
import { ImageField } from '../components/ImageUpload';

const EMPTY = { title: '', slug: '', excerpt: '', content: '', cover: null, author: 'Team', tags: [], published: true, publishedAt: new Date().toISOString().slice(0, 10) };

export default function Journal() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['posts-admin'], queryFn: () => get('/posts', { all: 1, limit: 50 }) });
  const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['posts-admin'] });

  const open = async (p) => {
    if (!p) return setEdit({ ...EMPTY });
    const full = await get(`/posts/${p._id}`);
    setEdit({ ...EMPTY, ...full, publishedAt: String(full.publishedAt || '').slice(0, 10) });
  };
  const save = async () => {
    if (!edit.title.trim()) return toast.error('Title is required');
    const body = { ...edit, tags: typeof edit.tags === 'string' ? edit.tags.split(',').map((t) => t.trim()).filter(Boolean) : edit.tags };
    try {
      if (edit._id) await put(`/posts/${edit._id}`, body); else await post('/posts', body);
      toast.success('Story saved'); setEdit(null); refresh();
    } catch (e) { toast.error(e.message); }
  };
  const remove = async () => { await del(`/posts/${confirm}`); toast.success('Deleted'); setConfirm(null); refresh(); };

  return (
    <div>
      <PageHeader title="Journal" subtitle="Stories shown on the Journal page.">
        <button className="btn-primary" onClick={() => open(null)}><Plus size={16} /> New story</button>
      </PageHeader>
      {isLoading ? <div className="skeleton h-48" /> : !data?.length ? <div className="card"><Empty icon={BookOpen} title="No stories yet" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <div key={p._id} className="card overflow-hidden">
              <Img image={p.cover} className="aspect-[16/9] w-full" sizes="400px" maxWidth={640} />
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted">{fmtDate(p.publishedAt)} {!p.published && <Badge tone="amber">Draft</Badge>}</div>
                <p className="mt-1 font-medium">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{p.excerpt}</p>
                <div className="mt-3 flex justify-end gap-1">
                  <button className="btn-icon" onClick={() => open(p)}><Pencil size={15} /></button>
                  <button className="btn-icon hover:!text-red-600" onClick={() => setConfirm(p._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit story' : 'New story'} width="max-w-3xl"
        footer={<><button className="btn-light" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {edit && (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Title *" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="md:col-span-2" />
            <Input label="Slug" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} />
            <Input label="Author" value={edit.author} onChange={(e) => setEdit({ ...edit, author: e.target.value })} />
            <Input label="Publish date" type="date" value={edit.publishedAt} onChange={(e) => setEdit({ ...edit, publishedAt: e.target.value })} />
            <Input label="Tags (comma separated)" value={Array.isArray(edit.tags) ? edit.tags.join(', ') : edit.tags} onChange={(e) => setEdit({ ...edit, tags: e.target.value })} />
            <Textarea label="Excerpt" rows={2} value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} className="md:col-span-2" />
            <Textarea label="Content" hint="Separate paragraphs with a blank line" rows={10} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} className="md:col-span-2" />
            <ImageField label="Cover image" value={edit.cover} onChange={(v) => setEdit({ ...edit, cover: v })} preset="post" aspect="aspect-[16/9]" className="md:col-span-2" />
            <Toggle label="Published" checked={edit.published} onChange={(v) => setEdit({ ...edit, published: v })} />
          </div>
        )}
      </Modal>
      <Confirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} text="Delete this story?" />
    </div>
  );
}
