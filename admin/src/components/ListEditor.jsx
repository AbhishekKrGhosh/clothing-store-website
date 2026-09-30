import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

/** Generic editor for arrays of objects (nav links, features, badges, slides…) */
export default function ListEditor({ items = [], onChange, render, newItem, addLabel = 'Add item', max, layout = 'stack' }) {
  const update = (i, patch) => onChange(items.map((it, k) => (k === i ? (typeof patch === 'function' ? patch(it) : { ...it, ...patch }) : it)));
  const move = (i, d) => {
    const arr = [...items];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  return (
    <div className="space-y-3">
      <div className={layout === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
        {items.map((it, i) => (
          <div key={i} className="relative rounded-xl border border-line bg-canvas/40 p-3 pr-11">
            {render(it, (patch) => update(i, patch), i)}
            <div className="absolute right-1.5 top-1.5 flex flex-col gap-0.5">
              <button type="button" className="btn-icon h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
              <button type="button" className="btn-icon h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down"><ArrowDown size={14} /></button>
              <button type="button" className="btn-icon h-7 w-7 hover:!text-red-600" onClick={() => onChange(items.filter((_, k) => k !== i))} title="Remove"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {(!max || items.length < max) && (
        <button type="button" onClick={() => onChange([...items, typeof newItem === 'function' ? newItem() : { ...newItem }])} className="btn-light w-full border-dashed">
          <Plus size={15} /> {addLabel}
        </button>
      )}
    </div>
  );
}
