import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export default function FreeShippingBar({ subtotal }) {
  const { settings, t, fmt } = useSite();
  const th = settings.commerce.freeShippingThreshold;
  if (!th) return null;
  const pct = Math.min(100, (subtotal / th) * 100);
  const done = subtotal >= th;
  return (
    <div className="rounded-brand bg-surface-alt/70 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs">
        <Truck size={14} className="text-primary" />
        {done ? t('freeShippingUnlocked') : t('freeShippingProgress', { amount: fmt(th - subtotal) })}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  );
}
