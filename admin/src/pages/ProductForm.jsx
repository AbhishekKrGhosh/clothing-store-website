import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../lib/api';
import { Card, Input, Select, Spinner, Textarea, Toggle } from '../components/ui';
import { ImagesField } from '../components/ImageUpload';
import ListEditor from '../components/ListEditor';

const EMPTY = {
  name: '', slug: '', sku: '', shortDescription: '', description: '', highlights: [], fabric: '', care: '',
  category: '', brand: '', gender: 'Unisex', price: '', comparePrice: '', images: [], colors: [], sizes: [], tags: [],
  featured: false, newArrival: true, bestSeller: false, active: true, order: 0,
};
const SIZE_PRESETS = {
  'S – XL': ['S', 'M', 'L', 'XL'],
  'XS – XXL': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Waist 28 – 36': ['28', '30', '32', '34', '36'],
  'Free Size': ['Free Size'],
};

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['product-edit', id], queryFn: () => get(`/products/${id}`), enabled: !isNew });
  const { data: cats } = useQuery({ queryKey: ['categories-all'], queryFn: () => get('/categories', { all: 1 }) });
  const { data: brands } = useQuery({ queryKey: ['brands-all'], queryFn: () => get('/brands', { all: 1 }) });

  useEffect(() => {
    if (data) setF({ ...EMPTY, ...data, category: data.category?._id || data.category || '', brand: data.brand?._id || data.brand || '', comparePrice: data.comparePrice || '' });
  }, [data]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === 'number' ? e.target.value : e.target.value) : e }));
  const stock = f.sizes.reduce((s, x) => s + (+x.stock || 0), 0);

  const save = async (e) => {
    e?.preventDefault();
    if (!f.name.trim()) return toast.error('Product name is required');
    if (f.price === '' || +f.price < 0) return toast.error('Enter a valid price');
    setSaving(true);
    const body = {
      ...f, price: +f.price, comparePrice: +f.comparePrice || 0, order: +f.order || 0,
      sizes: f.sizes.filter((s) => s.label).map((s) => ({ label: s.label, stock: +s.stock || 0 })),
      colors: f.colors.filter((c) => c.name),
      highlights: f.highlights.filter(Boolean),
      tags: typeof f.tags === 'string' ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : f.tags,
    };
    delete body._id; delete body.category_; delete body.rating; delete body.numReviews; delete body.sold; delete body.totalStock; delete body.id;
    try {
      const res = isNew ? await post('/products', body) : await put(`/products/${id}`, body);
      toast.success(isNew ? 'Product created' : 'Product saved');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['product-edit', id] });
      if (isNew) nav(`/products/${res._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <form onSubmit={save}>
      <div className="sticky top-16 z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <Link to="/products" className="btn-icon"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{isNew ? 'New product' : f.name || 'Edit product'}</h1>
          {!isNew && <p className="text-xs text-muted">{data?.rating ? `★ ${data.rating} · ${data.numReviews} reviews · ` : ''}{data?.sold || 0} sold</p>}
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}</button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr,360px]">
        <div className="space-y-5">
          <Card title="Basic information">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Product name *" value={f.name} onChange={set('name')} className="md:col-span-2" />
              <Input label="URL slug" hint="Leave blank to generate from the name" value={f.slug} onChange={set('slug')} />
              <Input label="SKU" value={f.sku} onChange={set('sku')} />
              <Textarea label="Short description" hint="Shown next to the price on the product page and in search" rows={2} value={f.shortDescription} onChange={set('shortDescription')} className="md:col-span-2" />
              <Textarea label="Full description" rows={5} value={f.description} onChange={set('description')} className="md:col-span-2" />
            </div>
          </Card>

          <Card title="Images" subtitle="Drag to reorder. The first image is the cover; the second shows on hover.">
            <ImagesField value={f.images} onChange={set('images')} preset="product" />
          </Card>

          <Card title="Colours" subtitle="Optional images per colour — shown first when a shopper picks that colour.">
            <ListEditor
              items={f.colors}
              onChange={set('colors')}
              newItem={() => ({ name: '', hex: '#556042', images: [] })}
              addLabel="Add colour"
              render={(c, up) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr,150px] gap-3">
                    <Input label="Colour name" value={c.name} onChange={(e) => up({ name: e.target.value })} />
                    <div>
                      <label className="label">Swatch</label>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-1.5">
                        <input type="color" value={c.hex || '#000000'} onChange={(e) => up({ hex: e.target.value })} className="h-8 w-9 cursor-pointer border-0 bg-transparent p-0" />
                        <input className="w-full bg-transparent font-mono text-xs uppercase" value={c.hex || ''} onChange={(e) => up({ hex: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <ImagesField value={c.images || []} onChange={(v) => up({ images: v })} preset="product" />
                </div>
              )}
            />
          </Card>

          <Card title="Sizes & stock" subtitle={`${stock} units in total`} actions={
            <div className="flex flex-wrap gap-1">
              {Object.entries(SIZE_PRESETS).map(([l, arr]) => (
                <button type="button" key={l} className="btn-light px-2 py-1 text-[11px]" onClick={() => setF((x) => ({ ...x, sizes: arr.map((label) => ({ label, stock: x.sizes.find((s) => s.label === label)?.stock ?? 10 })) }))}>{l}</button>
              ))}
            </div>
          }>
            <div className="space-y-2">
              {f.sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input" placeholder="Size" value={s.label} onChange={(e) => setF((x) => ({ ...x, sizes: x.sizes.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)) }))} />
                  <input className="input w-32" type="number" min="0" placeholder="Stock" value={s.stock} onChange={(e) => setF((x) => ({ ...x, sizes: x.sizes.map((y, k) => (k === i ? { ...y, stock: e.target.value } : y)) }))} />
                  <button type="button" className="btn-icon hover:!text-red-600" onClick={() => setF((x) => ({ ...x, sizes: x.sizes.filter((_, k) => k !== i) }))}><Trash2 size={15} /></button>
                </div>
              ))}
              <button type="button" className="btn-light w-full border-dashed" onClick={() => setF((x) => ({ ...x, sizes: [...x.sizes, { label: '', stock: 10 }] }))}><Plus size={15} /> Add size</button>
              {!f.sizes.length && <p className="text-xs text-muted">No sizes = product has no size selection and unlimited stock.</p>}
            </div>
          </Card>

          <Card title="Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Fabric" value={f.fabric} onChange={set('fabric')} />
              <Input label="Tags (comma separated)" value={Array.isArray(f.tags) ? f.tags.join(', ') : f.tags} onChange={set('tags')} />
              <Textarea label="Care instructions" value={f.care} onChange={set('care')} className="md:col-span-2" />
            </div>
            <div className="mt-4">
              <label className="label">Highlights</label>
              <ListEditor items={f.highlights.map((h) => ({ h }))} onChange={(arr) => setF((x) => ({ ...x, highlights: arr.map((a) => a.h) }))} newItem={{ h: '' }} addLabel="Add highlight"
                render={(it, up) => <input className="input" value={it.h} onChange={(e) => up({ h: e.target.value })} placeholder="e.g. 100% organic cotton" />} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Visibility">
            <div className="space-y-4">
              <Toggle label="Visible on store" checked={f.active} onChange={set('active')} />
              <Toggle label="Featured" hint="Appears in the home page Featured section" checked={f.featured} onChange={set('featured')} />
              <Toggle label="New arrival" checked={f.newArrival} onChange={set('newArrival')} />
              <Toggle label="Best seller" checked={f.bestSeller} onChange={set('bestSeller')} />
              <Input label="Display order" type="number" hint="Lower numbers appear first" value={f.order} onChange={set('order')} />
            </div>
          </Card>
          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Price *" type="number" min="0" value={f.price} onChange={set('price')} />
              <Input label="Compare at" type="number" min="0" hint="Shows as strikethrough" value={f.comparePrice} onChange={set('comparePrice')} />
            </div>
          </Card>
          <Card title="Organisation">
            <div className="space-y-4">
              <Select label="Category" value={f.category} onChange={set('category')} options={[{ value: '', label: '— None —' }, ...(cats || []).filter((c) => !c.link).map((c) => ({ value: c._id, label: c.name }))]} />
              <Select label="Brand" value={f.brand} onChange={set('brand')} options={[{ value: '', label: '— None —' }, ...(brands || []).map((b) => ({ value: b._id, label: b.name }))]} />
              <Select label="Shop for" value={f.gender} onChange={set('gender')} options={['Men', 'Women', 'Unisex', 'Kids']} />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
