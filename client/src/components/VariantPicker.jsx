import { Check } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { isLight } from '../lib/format';

export function ColorPicker({ colors = [], value, onChange }) {
  const { t } = useSite();
  if (!colors.length) return null;
  return (
    <div>
      <p className="mb-2.5 text-sm">
        <span className="text-muted">{t('color')}:</span> <span className="font-medium">{value}</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c) => {
          const active = c.name === value;
          return (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              onClick={() => onChange(c)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all ${active ? 'border-ink ring-2 ring-ink/15 ring-offset-2 ring-offset-bg' : 'border-line hover:scale-105'}`}
              style={{ backgroundColor: c.hex || '#ccc' }}
            >
              {active && <Check size={14} className={isLight(c.hex) ? 'text-ink' : 'text-white'} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SizePicker({ sizes = [], value, onChange, onGuide }) {
  const { t } = useSite();
  if (!sizes.length) return null;
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm text-muted">{t('size')}{value && <span className="font-medium text-ink">: {value}</span>}</p>
        {onGuide && <button type="button" onClick={onGuide} className="text-xs font-medium text-primary underline-offset-4 hover:underline">{t('sizeGuide')}</button>}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => {
          const out = s.stock <= 0;
          const active = s.label === value;
          return (
            <button
              key={s.label}
              type="button"
              disabled={out}
              onClick={() => onChange(s)}
              className={`relative min-w-[3rem] rounded-brand border px-3 py-2.5 text-sm transition-all ${active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:border-ink/60'} ${out ? 'cursor-not-allowed opacity-40 line-through' : ''}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QtyStepper({ value, onChange, max = 99, small = false }) {
  const cls = small ? 'h-8 w-8 text-sm' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface">
      <button type="button" className={`${cls} rounded-full text-muted hover:text-ink disabled:opacity-40`} disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label="Decrease">−</button>
      <span className={`${small ? 'w-6 text-sm' : 'w-8'} text-center tabular-nums`}>{value}</span>
      <button type="button" className={`${cls} rounded-full text-muted hover:text-ink disabled:opacity-40`} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">+</button>
    </div>
  );
}
