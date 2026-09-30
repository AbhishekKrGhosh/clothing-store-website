import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

export default function SectionHeader({ title, subtitle, linkLabel, linkUrl, className = '' }) {
  return (
    <Reveal className={`mb-6 flex items-end justify-between gap-4 md:mb-8 ${className}`}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted md:text-base">{subtitle}</p>}
      </div>
      {linkLabel && linkUrl && (
        <Link to={linkUrl} className="link-arrow shrink-0">
          {linkLabel} <ArrowRight size={15} />
        </Link>
      )}
    </Reveal>
  );
}
