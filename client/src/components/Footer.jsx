import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import Logo from './Logo';
import { useSite } from '../context/SiteContext';

const Pin = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="12" cy="12" r="10" /><path d="M10.5 7.5c3-1 5.5.5 5.5 3.2 0 2.4-1.6 4-3.5 4-1 0-1.7-.6-1.5-1.5l1.2-5M9.5 18l1.5-6" /></svg>
);

export default function Footer() {
  const { settings } = useSite();
  const { footer, contact, social, brand } = settings;
  const socials = [
    ['instagram', Instagram], ['facebook', Facebook], ['twitter', Twitter], ['youtube', Youtube], ['pinterest', Pin],
  ].filter(([k]) => social?.[k]);

  return (
    <footer className="mt-16 border-t border-line bg-surface-alt/40">
      <div className="container grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-2 font-heading text-lg italic text-muted">{brand.tagline}</p>
          {footer.about && <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{footer.about}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(([k, I]) => (
                <a key={k} href={social[k]} target="_blank" rel="noreferrer" aria-label={k} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 transition hover:border-primary hover:bg-primary hover:text-white">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5">
          {footer.columns?.map((col, i) => (
            <div key={i}>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em]">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links?.map((l, j) => (
                  <li key={j}><Link to={l.url} className="text-sm text-muted transition hover:text-primary">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="md:col-span-3">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em]">Contact</p>
          <ul className="space-y-3 text-sm text-muted">
            {contact.email && <li className="flex items-start gap-2"><Mail size={15} className="mt-0.5 shrink-0" /><a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a></li>}
            {contact.phone && <li className="flex items-start gap-2"><Phone size={15} className="mt-0.5 shrink-0" /><a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a></li>}
            {contact.address && <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0" />{contact.address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>{footer.copyright}</p>
          <p>{footer.bottomText}</p>
        </div>
      </div>
    </footer>
  );
}
