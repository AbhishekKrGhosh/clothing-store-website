import { useSite } from '../context/SiteContext';
import Icon from '../lib/icons';

export default function TrustBadges({ className = '', compact = false, tone = 'default' }) {
  const { settings } = useSite();
  const badges = settings.trustBadges || [];
  if (!badges.length) return null;
  return (
    <div className={`grid gap-4 ${badges.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} ${className}`}>
      {badges.map((b, i) => (
        <div key={i} className={`flex ${compact ? 'items-center gap-2 text-left' : 'flex-col items-center gap-2 text-center'}`}>
          <Icon name={b.icon} className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} shrink-0 ${tone === 'light' ? 'text-white' : 'text-ink/80'}`} />
          <div className="leading-tight">
            <p className={`text-[11px] font-medium md:text-xs ${tone === 'light' ? 'text-white' : ''}`}>{b.title}</p>
            {b.subtitle && <p className={`text-[10px] md:text-[11px] ${tone === 'light' ? 'text-white/70' : 'text-muted'}`}>{b.subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
