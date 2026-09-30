import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, X } from 'lucide-react';
import { get } from '../lib/api';
import useSingleton from '../lib/useSingleton';
import { Card, Input, PageHeader, SaveBar, Select, Spinner, Tabs, Textarea, Toggle } from '../components/ui';
import { ImageField } from '../components/ImageUpload';
import IconPicker from '../components/IconPicker';
import ListEditor from '../components/ListEditor';
import Img from '../components/Img';

const SECTION_NAMES = { hero: 'Hero banner', categories: 'Shop by Category', sustainability: 'Sustainability banner', featured: 'Featured products', lookbook: 'Lookbook strip', newsletter: 'Newsletter' };
const TABS = [['layout', 'Home layout'], ['hero', 'Hero'], ['categories', 'Categories'], ['sustainability', 'Sustainability'], ['featured', 'Featured'], ['lookbook', 'Lookbook'], ['newsletter', 'Newsletter'], ['collections', 'Collections page'], ['about', 'About page'], ['journal', 'Journal page']];

function SectionHead({ s, set, base, withSubtitle = true }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input label="Title" value={s.title} onChange={(e) => set(`${base}.title`, e.target.value)} />
      {withSubtitle && <Input label="Subtitle" value={s.subtitle} onChange={(e) => set(`${base}.subtitle`, e.target.value)} />}
      <Input label="Link label" value={s.linkLabel} onChange={(e) => set(`${base}.linkLabel`, e.target.value)} />
      <Input label="Link URL" value={s.linkUrl} onChange={(e) => set(`${base}.linkUrl`, e.target.value)} />
    </div>
  );
}

const FeatureList = ({ items, onChange }) => (
  <ListEditor items={items} onChange={onChange} newItem={{ icon: 'Leaf', title: '' }} addLabel="Add feature" layout="grid"
    render={(f, up) => (
      <div className="grid grid-cols-[140px,1fr] gap-2">
        <IconPicker value={f.icon} onChange={(v) => up({ icon: v })} />
        <Input label="Label" value={f.title} onChange={(e) => up({ title: e.target.value })} />
      </div>
    )} />
);

export default function Content() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'layout';
  const c = useSingleton('content');
  const { data: products } = useQuery({ queryKey: ['product-picker'], queryFn: () => get('/products', { all: 1, limit: 100, sort: 'name' }), enabled: tab === 'featured' });
  const [pick, setPick] = useState('');
  if (c.isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  const d = c.draft;
  const h = d.home;
  const set = c.set;

  const moveSection = (i, dir) => {
    const arr = [...h.sections];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set('home.sections', arr);
  };

  return (
    <div className="pb-20">
      <PageHeader title="Banners & Content" subtitle="Every section, image and word on your storefront pages." />
      <Tabs tabs={TABS} value={tab} onChange={(v) => setSp({ tab: v })} />

      {tab === 'layout' && (
        <Card title="Home page sections" subtitle="Reorder or hide sections of the home page.">
          <div className="space-y-2">
            {h.sections.map((s, i) => (
              <div key={s.key} className={`flex items-center gap-3 rounded-xl border p-3 ${s.enabled ? 'border-line bg-white' : 'border-dashed border-line bg-canvas text-muted'}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-canvas text-xs font-semibold">{i + 1}</span>
                <button className="flex-1 text-left font-medium" onClick={() => setSp({ tab: s.key })}>{SECTION_NAMES[s.key] || s.key}</button>
                <button className="btn-icon" onClick={() => set('home.sections', h.sections.map((x, k) => (k === i ? { ...x, enabled: !x.enabled } : x)))} title={s.enabled ? 'Hide' : 'Show'}>{s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button className="btn-icon" disabled={i === 0} onClick={() => moveSection(i, -1)}><ArrowUp size={15} /></button>
                <button className="btn-icon" disabled={i === h.sections.length - 1} onClick={() => moveSection(i, 1)}><ArrowDown size={15} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'hero' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
          <Card title="Hero text">
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea label="Headline" rows={2} value={h.hero.title} onChange={(e) => set('home.hero.title', e.target.value)} className="md:col-span-2" />
              <Textarea label="Subtitle" rows={2} value={h.hero.subtitle} onChange={(e) => set('home.hero.subtitle', e.target.value)} className="md:col-span-2" />
              <Input label="Primary button label" value={h.hero.primaryButton?.label} onChange={(e) => set('home.hero.primaryButton.label', e.target.value)} />
              <Input label="Primary button link" value={h.hero.primaryButton?.url} onChange={(e) => set('home.hero.primaryButton.url', e.target.value)} />
              <Input label="Secondary button label" value={h.hero.secondaryButton?.label} onChange={(e) => set('home.hero.secondaryButton.label', e.target.value)} />
              <Input label="Secondary button link" value={h.hero.secondaryButton?.url} onChange={(e) => set('home.hero.secondaryButton.url', e.target.value)} />
              <Input label="Handwritten badge (optional)" hint="e.g. “Wear Change” shown over the image" value={h.hero.badgeText} onChange={(e) => set('home.hero.badgeText', e.target.value)} className="md:col-span-2" />
            </div>
            <div className="mt-6"><p className="label">Feature icons</p><FeatureList items={h.hero.features} onChange={(v) => set('home.hero.features', v)} /></div>
          </Card>
          <Card title="Hero image"><ImageField value={h.hero.image} onChange={(v) => set('home.hero.image', v)} preset="hero" aspect="aspect-[4/3]" hint="Landscape photo, subject on the right works best." /></Card>
        </div>
      )}

      {tab === 'categories' && (
        <Card title="Shop by Category" subtitle="Tiles come from Categories marked “Show on home page”.">
          <SectionHead s={h.categories} set={set} base="home.categories" />
          <Input label="Max tiles" type="number" className="mt-4 max-w-xs" value={h.categories.limit} onChange={(e) => set('home.categories.limit', +e.target.value)} />
        </Card>
      )}

      {tab === 'sustainability' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
          <Card title="Sustainability banner">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={h.sustainability.title} onChange={(e) => set('home.sustainability.title', e.target.value)} className="md:col-span-2" />
              <Textarea label="Text" rows={3} value={h.sustainability.text} onChange={(e) => set('home.sustainability.text', e.target.value)} className="md:col-span-2" />
              <Input label="Button label" value={h.sustainability.button?.label} onChange={(e) => set('home.sustainability.button.label', e.target.value)} />
              <Input label="Button link" value={h.sustainability.button?.url} onChange={(e) => set('home.sustainability.button.url', e.target.value)} />
            </div>
            <div className="mt-6"><p className="label">Features</p><FeatureList items={h.sustainability.features} onChange={(v) => set('home.sustainability.features', v)} /></div>
          </Card>
          <Card title="Image"><ImageField value={h.sustainability.image} onChange={(v) => set('home.sustainability.image', v)} preset="banner" aspect="aspect-[16/9]" /></Card>
        </div>
      )}

      {tab === 'featured' && (
        <Card title="Featured products">
          <SectionHead s={h.featured} set={set} base="home.featured" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select label="Products to show" value={h.featured.source} onChange={(e) => set('home.featured.source', e.target.value)}
              options={[{ value: 'featured', label: 'Products marked “Featured”' }, { value: 'new', label: 'Newest arrivals' }, { value: 'bestseller', label: 'Best sellers' }, { value: 'manual', label: 'Hand-picked (below)' }]} />
            <Input label="How many" type="number" value={h.featured.limit} onChange={(e) => set('home.featured.limit', +e.target.value)} />
          </div>
          {h.featured.source === 'manual' && (
            <div className="mt-5">
              <p className="label">Hand-picked products (in order)</p>
              <div className="space-y-2">
                {h.featured.productIds.map((id, i) => {
                  const p = products?.items.find((x) => x._id === id);
                  return (
                    <div key={id} className="flex items-center gap-3 rounded-lg border border-line p-2">
                      <Img image={p?.images?.[0]} className="h-10 w-9 rounded-md" sizes="40px" maxWidth={160} />
                      <span className="flex-1 text-sm">{p?.name || id}</span>
                      <button className="btn-icon" disabled={i === 0} onClick={() => { const a = [...h.featured.productIds]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set('home.featured.productIds', a); }}><ArrowUp size={14} /></button>
                      <button className="btn-icon" onClick={() => set('home.featured.productIds', h.featured.productIds.filter((x) => x !== id))}><X size={14} /></button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose a product…</option>
                  {products?.items.filter((p) => !h.featured.productIds.includes(p._id)).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <button className="btn-dark" disabled={!pick} onClick={() => { set('home.featured.productIds', [...h.featured.productIds, pick]); setPick(''); }}>Add</button>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'lookbook' && (
        <div className="space-y-5">
          <Card title="Home page lookbook strip">
            <SectionHead s={h.lookbook} set={set} base="home.lookbook" />
            <Input label="Images to show on home" type="number" className="mt-4 max-w-xs" value={h.lookbook.limit} onChange={(e) => set('home.lookbook.limit', +e.target.value)} />
          </Card>
          <Card title="Lookbook page & images">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Page title" value={d.lookbook.title} onChange={(e) => set('lookbook.title', e.target.value)} />
              <Input label="Page subtitle" value={d.lookbook.subtitle} onChange={(e) => set('lookbook.subtitle', e.target.value)} />
            </div>
            <div className="mt-5">
              <ListEditor items={d.lookbook.items} onChange={(v) => set('lookbook.items', v)} newItem={{ image: null, caption: '', link: '' }} addLabel="Add lookbook image" layout="grid"
                render={(it, up) => (
                  <div className="grid grid-cols-[120px,1fr] gap-3">
                    <ImageField value={it.image} onChange={(v) => up({ image: v })} preset="lookbook" aspect="aspect-[4/5]" />
                    <div className="space-y-2">
                      <Input label="Caption" value={it.caption} onChange={(e) => up({ caption: e.target.value })} />
                      <Input label="Link (shop the look)" placeholder="/product/linen-overshirt" value={it.link} onChange={(e) => up({ link: e.target.value })} />
                    </div>
                  </div>
                )} />
            </div>
          </Card>
        </div>
      )}

      {tab === 'newsletter' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
          <Card title="Newsletter block">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={h.newsletter.title} onChange={(e) => set('home.newsletter.title', e.target.value)} className="md:col-span-2" />
              <Textarea label="Text" value={h.newsletter.text} onChange={(e) => set('home.newsletter.text', e.target.value)} className="md:col-span-2" />
              <Input label="Input placeholder" value={h.newsletter.placeholder} onChange={(e) => set('home.newsletter.placeholder', e.target.value)} />
              <Input label="Button label" value={h.newsletter.buttonLabel} onChange={(e) => set('home.newsletter.buttonLabel', e.target.value)} />
            </div>
            <div className="mt-4"><Toggle label="Show trust badges beside it" checked={h.newsletter.showTrustBadges} onChange={(v) => set('home.newsletter.showTrustBadges', v)} /></div>
          </Card>
          <Card title="Background image"><ImageField value={h.newsletter.image} onChange={(v) => set('home.newsletter.image', v)} preset="banner" aspect="aspect-[16/9]" /></Card>
        </div>
      )}

      {tab === 'collections' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
          <Card title="Collections / Shop page header">
            <div className="space-y-4">
              <Input label="Title" value={d.collections.title} onChange={(e) => set('collections.title', e.target.value)} />
              <Textarea label="Subtitle" value={d.collections.subtitle} onChange={(e) => set('collections.subtitle', e.target.value)} />
            </div>
          </Card>
          <Card title="Header image"><ImageField value={d.collections.image} onChange={(v) => set('collections.image', v)} preset="banner" aspect="aspect-[16/6]" /></Card>
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr,420px]">
            <Card title="About page">
              <div className="space-y-4">
                <Input label="Title" value={d.about.title} onChange={(e) => set('about.title', e.target.value)} />
                <Input label="Subtitle" value={d.about.subtitle} onChange={(e) => set('about.subtitle', e.target.value)} />
                <Textarea label="Intro" rows={4} value={d.about.intro} onChange={(e) => set('about.intro', e.target.value)} />
              </div>
            </Card>
            <Card title="Hero image"><ImageField value={d.about.image} onChange={(v) => set('about.image', v)} preset="hero" aspect="aspect-[16/9]" /></Card>
          </div>
          <Card title="Story blocks" subtitle="Alternating image + text sections">
            <ListEditor items={d.about.blocks} onChange={(v) => set('about.blocks', v)} newItem={{ title: '', text: '', image: null }} addLabel="Add block"
              render={(b, up) => (
                <div className="grid gap-3 md:grid-cols-[200px,1fr]">
                  <ImageField value={b.image} onChange={(v) => up({ image: v })} preset="banner" aspect="aspect-[4/3]" />
                  <div className="space-y-2">
                    <Input label="Title" value={b.title} onChange={(e) => up({ title: e.target.value })} />
                    <Textarea label="Text" rows={3} value={b.text} onChange={(e) => up({ text: e.target.value })} />
                  </div>
                </div>
              )} />
          </Card>
          <Card title="Values">
            <ListEditor items={d.about.values} onChange={(v) => set('about.values', v)} newItem={{ icon: 'Leaf', title: '', text: '' }} addLabel="Add value" layout="grid"
              render={(v, up) => (
                <div className="grid grid-cols-[130px,1fr] gap-2">
                  <IconPicker value={v.icon} onChange={(x) => up({ icon: x })} />
                  <Input label="Title" value={v.title} onChange={(e) => up({ title: e.target.value })} />
                  <Input label="Text" className="col-span-2" value={v.text} onChange={(e) => up({ text: e.target.value })} />
                </div>
              )} />
          </Card>
        </div>
      )}

      {tab === 'journal' && (
        <Card title="Journal page header" subtitle="Manage stories under Journal in the sidebar.">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Title" value={d.journal.title} onChange={(e) => set('journal.title', e.target.value)} />
            <Input label="Subtitle" value={d.journal.subtitle} onChange={(e) => set('journal.subtitle', e.target.value)} />
          </div>
        </Card>
      )}

      <SaveBar dirty={c.dirty} saving={c.saving} onSave={c.save} onReset={c.reset} />
    </div>
  );
}
