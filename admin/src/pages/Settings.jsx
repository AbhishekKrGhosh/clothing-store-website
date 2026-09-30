import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { del, get, post, put } from '../lib/api';
import { bytes } from '../lib/format';
import useSingleton from '../lib/useSingleton';
import { useAuth } from '../context/AuthContext';
import { Card, ColorInput, Input, PageHeader, SaveBar, Select, Spinner, Tabs, Textarea, Toggle } from '../components/ui';
import { ImageField } from '../components/ImageUpload';
import IconPicker from '../components/IconPicker';
import ListEditor from '../components/ListEditor';

const TABS = [['brand', 'Brand'], ['theme', 'Colours & fonts'], ['navigation', 'Navigation'], ['badges', 'Announcement & badges'], ['footer', 'Footer'], ['contact', 'Contact & social'], ['commerce', 'Store & shipping'], ['sizeguide', 'Size guide'], ['texts', 'Site texts'], ['seo', 'SEO'], ['media', 'Media & storage'], ['account', 'Account & admins']];
const HEADING_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Lora', 'DM Serif Display', 'Fraunces', 'Libre Baskerville', 'EB Garamond', 'Marcellus', 'Prata', 'Italiana'];
const BODY_FONTS = ['Jost', 'Inter', 'DM Sans', 'Poppins', 'Manrope', 'Outfit', 'Nunito Sans', 'Karla', 'Work Sans', 'Lato'];
const DEFAULT_THEME = { primary: '#B4532A', primaryDark: '#96431F', secondary: '#2F3A2D', accent: '#C9A27E', background: '#F8F4EE', surface: '#FFFFFF', surfaceAlt: '#F1EAE0', text: '#2A2521', muted: '#7D7369', border: '#E8DFD3' };
const COLOR_LABELS = { primary: 'Primary (buttons, links)', primaryDark: 'Primary hover', secondary: 'Secondary (dark buttons, bar)', accent: 'Accent', background: 'Page background', surface: 'Cards', surfaceAlt: 'Soft panels', text: 'Text', muted: 'Muted text', border: 'Borders' };
const human = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const LinkList = ({ items, onChange, addLabel = 'Add link' }) => (
  <ListEditor items={items} onChange={onChange} newItem={{ label: '', url: '/' }} addLabel={addLabel}
    render={(l, up) => (
      <div className="grid grid-cols-2 gap-2">
        <Input label="Label" value={l.label} onChange={(e) => up({ label: e.target.value })} />
        <Input label="URL" value={l.url} onChange={(e) => up({ url: e.target.value })} />
      </div>
    )} />
);

function loadFont(f) {
  const id = `gf-${f}`;
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id; l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;500;600&display=swap`;
  document.head.appendChild(l);
}

export default function Settings() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'brand';
  const s = useSingleton('settings');
  const [labelFilter, setLabelFilter] = useState('');
  useEffect(() => { if (s.draft) { loadFont(s.draft.theme.headingFont); loadFont(s.draft.theme.bodyFont); } }, [s.draft?.theme.headingFont, s.draft?.theme.bodyFont]); // eslint-disable-line react-hooks/exhaustive-deps

  if (s.isLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  const d = s.draft;
  const set = s.set;
  const t = d.theme;

  return (
    <div className="pb-20">
      <PageHeader title="Settings" subtitle="Brand, theme, navigation, texts and everything else across your store." />
      <Tabs tabs={TABS} value={tab} onChange={(v) => setSp({ tab: v })} />

      {tab === 'brand' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Brand identity">
            <div className="space-y-4">
              <Input label="Store / brand name" value={d.brand.name} onChange={(e) => set('brand.name', e.target.value)} hint="Shown as the text logo when no logo image is uploaded" />
              <Input label="Tagline" value={d.brand.tagline} onChange={(e) => set('brand.tagline', e.target.value)} />
              <Input label="Logo height (px)" type="number" value={d.brand.logoHeight} onChange={(e) => set('brand.logoHeight', +e.target.value)} />
            </div>
          </Card>
          <Card title="Logo & favicon">
            <div className="grid grid-cols-2 gap-4">
              <ImageField label="Logo (optional)" value={d.brand.logo} onChange={(v) => set('brand.logo', v)} preset="logo" aspect="aspect-[3/1]" hint="Transparent PNG works best" />
              <ImageField label="Favicon" value={d.brand.favicon} onChange={(v) => set('brand.favicon', v)} preset="avatar" aspect="aspect-square" />
            </div>
          </Card>
        </div>
      )}

      {tab === 'theme' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,380px]">
          <Card title="Colours" actions={<button className="btn-light py-1.5 text-xs" onClick={() => set('theme', { ...t, ...DEFAULT_THEME })}>Reset palette</button>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.keys(COLOR_LABELS).map((k) => <ColorInput key={k} label={COLOR_LABELS[k]} value={t[k]} onChange={(v) => set(`theme.${k}`, v)} />)}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Select label="Heading font" value={t.headingFont} onChange={(e) => set('theme.headingFont', e.target.value)} options={HEADING_FONTS} />
              <Select label="Body font" value={t.bodyFont} onChange={(e) => set('theme.bodyFont', e.target.value)} options={BODY_FONTS} />
              <div>
                <label className="label">Corner radius: {t.radius}px</label>
                <input type="range" min="0" max="24" value={t.radius} onChange={(e) => set('theme.radius', +e.target.value)} className="mt-3 w-full accent-brand" />
              </div>
            </div>
          </Card>
          <Card title="Live preview">
            <div className="overflow-hidden border" style={{ background: t.background, color: t.text, borderColor: t.border, borderRadius: t.radius + 4, fontFamily: t.bodyFont }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontFamily: t.headingFont, letterSpacing: '0.18em', fontSize: 20 }}>{d.brand.name}</span>
                <span className="text-xs" style={{ color: t.muted }}>Home · Shop · About</span>
              </div>
              <div className="p-5">
                <p style={{ fontFamily: t.headingFont, fontSize: 30, lineHeight: 1.05 }}>Everyday Clothing for a Kinder Tomorrow</p>
                <p className="mt-2 text-sm" style={{ color: t.muted }}>Timeless silhouettes. Thoughtful fabrics.</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full px-4 py-2 text-xs text-white" style={{ background: t.primary }}>Shop New Arrivals →</span>
                  <span className="rounded-full px-4 py-2 text-xs text-white" style={{ background: t.secondary }}>Our Story</span>
                </div>
                <div className="mt-5 p-3 text-xs" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius }}>
                  <div className="mb-2 h-16" style={{ background: t.surfaceAlt, borderRadius: Math.max(0, t.radius - 4) }} />
                  Linen Overshirt <span style={{ color: t.muted }}>· Men</span>
                  <p className="mt-1 font-medium">₹2,499</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'navigation' && (
        <Card title="Header menu" subtitle="Links in the top navigation (and mobile menu). Use /shop?gender=Men, /shop?category=shirts, /about, etc.">
          <LinkList items={d.nav} onChange={(v) => set('nav', v)} />
        </Card>
      )}

      {tab === 'badges' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Announcement bar">
            <div className="space-y-4">
              <Toggle label="Show announcement bar" checked={d.announcement.enabled} onChange={(v) => set('announcement.enabled', v)} />
              <Input label="Text" value={d.announcement.text} onChange={(e) => set('announcement.text', e.target.value)} />
              <Input label="Link" value={d.announcement.link} onChange={(e) => set('announcement.link', e.target.value)} />
            </div>
          </Card>
          <Card title="Trust badges" subtitle="Shown on product, cart and newsletter sections">
            <ListEditor items={d.trustBadges} onChange={(v) => set('trustBadges', v)} newItem={{ icon: 'Truck', title: '', subtitle: '' }} addLabel="Add badge"
              render={(b, up) => (
                <div className="grid grid-cols-[130px,1fr,1fr] gap-2">
                  <IconPicker value={b.icon} onChange={(v) => up({ icon: v })} />
                  <Input label="Title" value={b.title} onChange={(e) => up({ title: e.target.value })} />
                  <Input label="Subtitle" value={b.subtitle} onChange={(e) => up({ subtitle: e.target.value })} />
                </div>
              )} />
          </Card>
        </div>
      )}

      {tab === 'footer' && (
        <div className="space-y-5">
          <Card title="Footer text">
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea label="About text" value={d.footer.about} onChange={(e) => set('footer.about', e.target.value)} className="md:col-span-2" />
              <Input label="Copyright" value={d.footer.copyright} onChange={(e) => set('footer.copyright', e.target.value)} />
              <Input label="Bottom right text" value={d.footer.bottomText} onChange={(e) => set('footer.bottomText', e.target.value)} />
            </div>
          </Card>
          <Card title="Footer link columns">
            <ListEditor items={d.footer.columns} onChange={(v) => set('footer.columns', v)} newItem={() => ({ title: 'New column', links: [] })} addLabel="Add column"
              render={(col, up) => (
                <div className="space-y-3">
                  <Input label="Column title" value={col.title} onChange={(e) => up({ title: e.target.value })} />
                  <LinkList items={col.links} onChange={(v) => up({ links: v })} />
                </div>
              )} />
          </Card>
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Contact details">
            <div className="space-y-4">
              <Input label="Email" value={d.contact.email} onChange={(e) => set('contact.email', e.target.value)} />
              <Input label="Phone" value={d.contact.phone} onChange={(e) => set('contact.phone', e.target.value)} />
              <Textarea label="Address" value={d.contact.address} onChange={(e) => set('contact.address', e.target.value)} />
            </div>
          </Card>
          <Card title="Social links" subtitle="Leave blank to hide">
            <div className="space-y-4">
              {Object.keys(d.social).map((k) => <Input key={k} label={human(k)} placeholder="https://" value={d.social[k]} onChange={(e) => set(`social.${k}`, e.target.value)} />)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'commerce' && (
        <Card title="Store & shipping">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Currency symbol" value={d.commerce.currency} onChange={(e) => set('commerce.currency', e.target.value)} />
            <Input label="Free shipping above" type="number" hint="0 = never free" value={d.commerce.freeShippingThreshold} onChange={(e) => set('commerce.freeShippingThreshold', +e.target.value)} />
            <Input label="Shipping fee" type="number" value={d.commerce.shippingFee} onChange={(e) => set('commerce.shippingFee', +e.target.value)} />
            <Input label="Tax %" type="number" value={d.commerce.taxPercent} onChange={(e) => set('commerce.taxPercent', +e.target.value)} />
            <Input label="Return window (days)" type="number" value={d.commerce.returnDays} onChange={(e) => set('commerce.returnDays', +e.target.value)} />
            <Input label="Low stock threshold" type="number" value={d.commerce.lowStockThreshold} onChange={(e) => set('commerce.lowStockThreshold', +e.target.value)} />
          </div>
          <div className="mt-6 space-y-4">
            <Toggle label="Cash on delivery" hint="Allow customers to place COD orders" checked={d.commerce.codEnabled} onChange={(v) => set('commerce.codEnabled', v)} />
            <Toggle label="Auto-approve reviews" hint="Publish customer reviews without moderation" checked={d.commerce.autoApproveReviews} onChange={(v) => set('commerce.autoApproveReviews', v)} />
          </div>
        </Card>
      )}

      {tab === 'sizeguide' && (
        <Card title="Size guide" subtitle="Shown from the “Size Guide” link on product pages">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Title" value={d.sizeGuide.title} onChange={(e) => set('sizeGuide.title', e.target.value)} />
            <Input label="Note" value={d.sizeGuide.note} onChange={(e) => set('sizeGuide.note', e.target.value)} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {d.sizeGuide.headers.map((h, i) => (
                    <th key={i} className="p-1"><input className="input font-medium" value={h} onChange={(e) => set('sizeGuide.headers', d.sizeGuide.headers.map((x, k) => (k === i ? e.target.value : x)))} /></th>
                  ))}
                  <th className="w-20 p-1">
                    <button className="btn-light w-full px-2 text-xs" onClick={() => { set('sizeGuide.headers', [...d.sizeGuide.headers, 'New']); set('sizeGuide.rows', d.sizeGuide.rows.map((r) => [...r, ''])); }}>+ Col</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.sizeGuide.rows.map((r, ri) => (
                  <tr key={ri}>
                    {d.sizeGuide.headers.map((_, ci) => (
                      <td key={ci} className="p-1"><input className="input" value={r[ci] ?? ''} onChange={(e) => set('sizeGuide.rows', d.sizeGuide.rows.map((row, k) => (k === ri ? d.sizeGuide.headers.map((__, c) => (c === ci ? e.target.value : row[c] ?? '')) : row)))} /></td>
                    ))}
                    <td className="p-1 text-center"><button className="btn-icon hover:!text-red-600" onClick={() => set('sizeGuide.rows', d.sizeGuide.rows.filter((_, k) => k !== ri))}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex gap-2">
              <button className="btn-light text-xs" onClick={() => set('sizeGuide.rows', [...d.sizeGuide.rows, d.sizeGuide.headers.map(() => '')])}><Plus size={14} /> Add row</button>
              {d.sizeGuide.headers.length > 1 && <button className="btn-light text-xs" onClick={() => { set('sizeGuide.headers', d.sizeGuide.headers.slice(0, -1)); set('sizeGuide.rows', d.sizeGuide.rows.map((r) => r.slice(0, d.sizeGuide.headers.length - 1))); }}>Remove last column</button>}
            </div>
          </div>
        </Card>
      )}

      {tab === 'texts' && (
        <Card title="Site texts" subtitle="Every button, label and message used across the storefront. Use {amount} where shown." actions={<input className="input w-56 py-1.5" placeholder="Filter…" value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} />}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.keys(d.labels).filter((k) => !labelFilter || `${k} ${d.labels[k]}`.toLowerCase().includes(labelFilter.toLowerCase())).map((k) => (
              <Input key={k} label={human(k)} value={d.labels[k]} onChange={(e) => set(`labels.${k}`, e.target.value)} />
            ))}
          </div>
        </Card>
      )}

      {tab === 'seo' && (
        <Card title="Search engine defaults">
          <div className="space-y-4">
            <Input label="Home page title" value={d.seo.title} onChange={(e) => set('seo.title', e.target.value)} />
            <Textarea label="Meta description" value={d.seo.description} onChange={(e) => set('seo.description', e.target.value)} />
          </div>
        </Card>
      )}

      {tab === 'media' && <MediaTab />}
      {tab === 'account' && <AccountTab />}

      {!['media', 'account'].includes(tab) && <SaveBar dirty={s.dirty} saving={s.saving} onSave={s.save} onReset={s.reset} />}
    </div>
  );
}

function MediaTab() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['media-stats'], queryFn: () => get('/images', { limit: 1 }) });
  const [busy, setBusy] = useState(false);
  const clean = async () => {
    setBusy(true);
    try {
      const r = await post('/images/cleanup');
      toast.success(`Removed ${r.removed} unused images (${bytes(r.freedBytes)} freed)`);
      qc.invalidateQueries({ queryKey: ['media-stats'] });
      qc.invalidateQueries({ queryKey: ['media'] });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Card title="Media & storage">
      <div className="flex flex-wrap items-center gap-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand"><HardDrive size={24} /></span>
        <div className="flex-1">
          <p className="text-2xl font-semibold">{data ? bytes(data.totalBytes) : '…'}</p>
          <p className="text-sm text-muted">{data?.total ?? '…'} images stored in MongoDB as optimised WebP (base64)</p>
        </div>
        <button className="btn-dark" disabled={busy} onClick={clean}>{busy ? 'Cleaning…' : 'Remove unused images'}</button>
      </div>
      <p className="mt-5 text-xs text-muted">Every upload is auto-rotated, stripped of metadata, resized to a sensible maximum (e.g. 1100px for products, 1800px for hero banners) and converted to WebP before it's saved. Smaller sizes are generated on the fly and cached for fast, lazy-loaded pages.</p>
    </Card>
  );
}

function AccountTab() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [prof, setProf] = useState({ name: user.name, email: user.email });
  const [na, setNa] = useState({ name: '', email: '', password: '' });
  const { data: admins } = useQuery({ queryKey: ['admins'], queryFn: () => get('/users', { role: 'admin', limit: 50 }) });

  const saveProf = async () => { try { setUser(await put('/auth/me', prof)); toast.success('Profile updated'); } catch (e) { toast.error(e.message); } };
  const savePw = async () => { try { await put('/auth/password', pw); toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }); } catch (e) { toast.error(e.message); } };
  const addAdmin = async () => { try { await post('/users', { ...na, role: 'admin' }); toast.success('Admin added'); setNa({ name: '', email: '', password: '' }); qc.invalidateQueries({ queryKey: ['admins'] }); } catch (e) { toast.error(e.message); } };
  const removeAdmin = async (id) => { try { await del(`/users/${id}`); qc.invalidateQueries({ queryKey: ['admins'] }); } catch (e) { toast.error(e.message); } };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Your profile">
        <div className="space-y-4">
          <Input label="Name" value={prof.name} onChange={(e) => setProf({ ...prof, name: e.target.value })} />
          <Input label="Email (login)" value={prof.email} onChange={(e) => setProf({ ...prof, email: e.target.value })} />
          <button className="btn-primary" onClick={saveProf}>Save profile</button>
        </div>
      </Card>
      <Card title="Change password">
        <div className="space-y-4">
          <Input label="Current password" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          <Input label="New password" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          <button className="btn-primary" onClick={savePw}>Update password</button>
        </div>
      </Card>
      <Card title="Admin users" className="lg:col-span-2">
        <div className="divide-y divide-line">
          {admins?.items.map((a) => (
            <div key={a._id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-side text-sm font-semibold text-white">{a.name[0]}</span>
              <span className="flex-1"><span className="block text-sm font-medium">{a.name}</span><span className="text-xs text-muted">{a.email}</span></span>
              {a._id !== user._id && <button className="btn-icon hover:!text-red-600" onClick={() => removeAdmin(a._id)}><Trash2 size={15} /></button>}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-4">
          <Input label="Name" value={na.name} onChange={(e) => setNa({ ...na, name: e.target.value })} />
          <Input label="Email" value={na.email} onChange={(e) => setNa({ ...na, email: e.target.value })} />
          <Input label="Password" type="password" value={na.password} onChange={(e) => setNa({ ...na, password: e.target.value })} />
          <div className="flex items-end"><button className="btn-dark w-full" onClick={addAdmin}>Add admin</button></div>
        </div>
      </Card>
    </div>
  );
}
