import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className = '', bodyClass = 'p-5' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function Input({ label, hint, className = '', ...p }) {
  return <Field label={label} hint={hint} className={className}><input className="input" {...p} value={p.value ?? ''} /></Field>;
}

export function Textarea({ label, hint, className = '', rows = 3, ...p }) {
  return <Field label={label} hint={hint} className={className}><textarea rows={rows} className="input resize-y" {...p} value={p.value ?? ''} /></Field>;
}

export function Select({ label, hint, className = '', options = [], ...p }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className="input" {...p} value={p.value ?? ''}>
        {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      {(label || hint) && (
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-line'}`}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function ColorInput({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-1.5 pr-3">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0" />
        <input className="w-full bg-transparent font-mono text-xs uppercase" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

const BADGE = {
  green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700', violet: 'bg-violet-50 text-violet-700', indigo: 'bg-indigo-50 text-indigo-700', gray: 'bg-canvas text-muted',
};
export const STATUS_TONE = { Pending: 'amber', Confirmed: 'blue', Packed: 'violet', Shipped: 'indigo', Delivered: 'green', Cancelled: 'red' };
export const STATUS_HEX = { Pending: '#E0A33A', Confirmed: '#3B8FD9', Packed: '#8B6BD6', Shipped: '#5363D6', Delivered: '#2E9E6A', Cancelled: '#D6524B' };

export function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${BADGE[tone]}`}>{children}</span>;
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-muted ${className}`} />;
}

export function Empty({ icon: I, title, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {I && <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas"><I size={22} className="text-muted" /></span>}
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${width}`}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <button onClick={onClose} className="btn-icon" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Confirm({ open, onClose, onConfirm, title = 'Are you sure?', text, confirmLabel = 'Delete', busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm"
      footer={<><button className="btn-light" onClick={onClose}>Cancel</button><button className="btn-danger" disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button></>}>
      <p className="text-sm text-muted">{text}</p>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
      {tabs.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition ${value === k ? 'text-white' : 'text-muted hover:text-ink'}`}>
          {value === k && <motion.span layoutId={`tabs-${tabs[0][0]}`} className="absolute inset-0 rounded-lg bg-side" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
      <span className="text-muted">Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button className="btn-light py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <button className="btn-light py-1.5" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset }) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:pl-64">
          <div className="flex items-center gap-3 rounded-2xl bg-side px-4 py-3 text-white shadow-2xl">
            <span className="text-sm">You have unsaved changes</span>
            {onReset && <button onClick={onReset} className="rounded-lg px-3 py-1.5 text-sm text-white/70 hover:text-white">Discard</button>}
            <button onClick={onSave} disabled={saving} className="btn-primary py-1.5">{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
