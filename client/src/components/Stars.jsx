import { Star } from 'lucide-react';

export default function Stars({ value = 0, size = 14, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="absolute text-accent/40" strokeWidth={1.5} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, value - i + 1)) * 100}%` }}>
            <Star size={size} className="fill-amber-500 text-amber-500" strokeWidth={1.5} />
          </span>
        </span>
      ))}
    </span>
  );
}
