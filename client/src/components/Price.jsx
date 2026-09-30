import { useSite } from '../context/SiteContext';

export default function Price({ price, compare, className = '', big = false }) {
  const { fmt } = useSite();
  const off = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={big ? 'text-2xl font-medium' : 'text-sm font-medium'}>{fmt(price)}</span>
      {off > 0 && (
        <>
          <span className={`${big ? 'text-base' : 'text-xs'} text-muted line-through`}>{fmt(compare)}</span>
          <span className={`${big ? 'text-sm' : 'text-[11px]'} font-medium text-primary`}>{off}% off</span>
        </>
      )}
    </span>
  );
}
