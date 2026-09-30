import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Icon, { ICONS } from '../lib/icons';

export default function IconPicker({ value, onChange, label = 'Icon' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      {label && <label className="label">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="input flex items-center gap-2 text-left">
        <Icon name={value} className="h-4 w-4" /> <span className="flex-1 truncate">{value || 'Choose'}</span> <ChevronDown size={14} className="text-muted" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 grid max-h-64 w-64 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-xl">
          {Object.keys(ICONS).map((n) => (
            <button key={n} type="button" title={n} onClick={() => { onChange(n); setOpen(false); }} className={`flex h-9 items-center justify-center rounded-lg hover:bg-canvas ${n === value ? 'bg-brand-light text-brand' : ''}`}>
              <Icon name={n} className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
