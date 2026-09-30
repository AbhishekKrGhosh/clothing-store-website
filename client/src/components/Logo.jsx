import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { imgUrl } from '../lib/api';

export default function Logo({ className = '', light = false }) {
  const { settings } = useSite();
  const { name, logo, logoHeight = 34 } = settings.brand;
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label={name}>
      {logo ? (
        <img src={imgUrl(logo, 400)} alt={name} style={{ height: logoHeight }} className="w-auto object-contain" />
      ) : (
        <span className={`font-heading text-[1.7rem] font-medium leading-none tracking-[0.18em] ${light ? 'text-white' : 'text-ink'}`}>{name}</span>
      )}
    </Link>
  );
}
