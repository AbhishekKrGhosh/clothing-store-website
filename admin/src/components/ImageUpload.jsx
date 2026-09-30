import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GripVertical, ImagePlus, Images, Star, Trash2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, uploadImages } from '../lib/api';
import { bytes } from '../lib/format';
import Img from './Img';
import { Modal, Spinner } from './ui';

function useUploader(preset) {
  const [progress, setProgress] = useState(null);
  const upload = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return [];
    setProgress(0);
    try {
      const refs = await uploadImages(files, preset, setProgress);
      toast.success(`${refs.length} image${refs.length > 1 ? 's' : ''} optimised & saved`);
      return refs;
    } catch (e) {
      toast.error(e.message);
      return [];
    } finally {
      setProgress(null);
    }
  };
  return { upload, progress };
}

function DropZone({ onFiles, multiple, busy, progress, className = '', children }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => !busy && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition ${over ? 'border-brand bg-brand-light' : 'border-line bg-canvas/60 hover:border-brand/40'} ${className}`}
    >
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
      {busy ? (
        <>
          <Spinner />
          <span className="text-xs text-muted">{progress < 100 ? `Uploading ${progress}%` : 'Optimising…'}</span>
        </>
      ) : children || (
        <>
          <UploadCloud size={22} className="text-muted" />
          <span className="text-xs font-medium">Drop or click to upload</span>
          <span className="text-[10px] text-muted">Auto-converted to WebP & resized</span>
        </>
      )}
    </div>
  );
}

export function MediaLibrary({ open, onClose, onPick, multiple = false }) {
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState([]);
  const { data, isLoading } = useQuery({ queryKey: ['media', page], queryFn: () => get('/images', { page, limit: 40 }), enabled: open });
  const toggle = (it) => {
    if (!multiple) { onPick([it]); onClose(); return; }
    setSel((s) => (s.some((x) => x.id === it.id) ? s.filter((x) => x.id !== it.id) : [...s, it]));
  };
  return (
    <Modal open={open} onClose={onClose} title="Media library" width="max-w-4xl"
      footer={multiple && <><span className="mr-auto text-xs text-muted">{sel.length} selected</span><button className="btn-light" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!sel.length} onClick={() => { onPick(sel); setSel([]); onClose(); }}>Add selected</button></>}>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <>
          <p className="mb-3 text-xs text-muted">{data?.total} images · {bytes(data?.totalBytes)} total</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {data?.items.map((it) => {
              const active = sel.some((x) => x.id === it.id);
              return (
                <button key={it.id} onClick={() => toggle(it)} className={`group relative overflow-hidden rounded-lg border-2 ${active ? 'border-brand' : 'border-transparent'}`}>
                  <Img image={it} className="aspect-square w-full" sizes="160px" maxWidth={320} />
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">{it.w}×{it.h} · {bytes(it.size)}</span>
                </button>
              );
            })}
          </div>
          {data?.pages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button className="btn-light py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button className="btn-light py-1.5" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/** Single image field */
export function ImageField({ value, onChange, preset = 'default', label, hint, aspect = 'aspect-[4/3]', className = '' }) {
  const { upload, progress } = useUploader(preset);
  const [lib, setLib] = useState(false);
  const onFiles = async (files) => {
    const [ref] = await upload([files[0]]);
    if (ref) onChange({ ...ref, alt: value?.alt || '' });
  };
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {value?.url ? (
        <div className="group relative overflow-hidden rounded-xl border border-line">
          <Img image={value} className={`${aspect} w-full`} sizes="400px" maxWidth={800} />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
            <DropZone onFiles={onFiles} busy={progress !== null} progress={progress} className="!border-white/60 !bg-white/90 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium"><ImagePlus size={14} /> Replace</span>
            </DropZone>
            <button type="button" onClick={() => setLib(true)} className="rounded-xl bg-white/90 px-3 py-2 text-xs font-medium"><Images size={14} className="inline" /> Library</button>
            <button type="button" onClick={() => onChange(null)} className="rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-red-600"><Trash2 size={14} className="inline" /></button>
          </div>
          {progress !== null && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Spinner /></div>}
        </div>
      ) : (
        <div className="space-y-2">
          <DropZone onFiles={onFiles} busy={progress !== null} progress={progress} className={`${aspect} w-full`} />
          <button type="button" onClick={() => setLib(true)} className="text-xs text-brand hover:underline">or choose from library</button>
        </div>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      <MediaLibrary open={lib} onClose={() => setLib(false)} onPick={([it]) => onChange({ id: it.id, url: it.url, blur: it.blur, w: it.w, h: it.h, alt: value?.alt || '' })} />
    </div>
  );
}

/** Multiple images with drag-to-reorder; first image is the cover */
export function ImagesField({ value = [], onChange, preset = 'product', label, hint }) {
  const { upload, progress } = useUploader(preset);
  const [drag, setDrag] = useState(null);
  const [lib, setLib] = useState(false);
  const onFiles = async (files) => {
    const refs = await upload(files);
    if (refs.length) onChange([...value, ...refs]);
  };
  const move = (from, to) => {
    const arr = [...value];
    const [x] = arr.splice(from, 1);
    arr.splice(to, 0, x);
    onChange(arr);
  };
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((im, i) => (
          <div
            key={im.id || i}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
            className={`group relative overflow-hidden rounded-xl border ${i === 0 ? 'border-brand' : 'border-line'} ${drag === i ? 'opacity-40' : ''}`}
          >
            <Img image={im} className="aspect-[4/5] w-full" sizes="160px" maxWidth={320} />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-medium text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
              <span className="cursor-grab text-white"><GripVertical size={16} /></span>
              <span className="flex gap-1">
                {i > 0 && <button type="button" title="Make cover" onClick={() => move(i, 0)} className="rounded bg-white/90 p-1"><Star size={12} /></button>}
                <button type="button" title="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-red-600"><Trash2 size={12} /></button>
              </span>
            </div>
          </div>
        ))}
        <DropZone onFiles={onFiles} multiple busy={progress !== null} progress={progress} className="aspect-[4/5]" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        {hint ? <p className="text-[11px] text-muted">{hint}</p> : <span />}
        <button type="button" onClick={() => setLib(true)} className="text-xs text-brand hover:underline">Add from library</button>
      </div>
      <MediaLibrary open={lib} multiple onClose={() => setLib(false)} onPick={(items) => onChange([...value, ...items.map(({ id, url, blur, w, h }) => ({ id, url, blur, w, h }))])} />
    </div>
  );
}
