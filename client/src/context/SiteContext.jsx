import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, imgUrl } from '../lib/api';
import { hexToRgb, money } from '../lib/format';

const SiteCtx = createContext(null);

const loadedFonts = new Set();
function loadFont(family) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`;
  document.head.appendChild(link);
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  ['primary', 'primaryDark', 'secondary', 'accent', 'background', 'surface', 'surfaceAlt', 'text', 'muted', 'border'].forEach((k) => {
    if (theme[k]) root.style.setProperty(`--c-${k}`, hexToRgb(theme[k]));
  });
  if (theme.headingFont) {
    root.style.setProperty('--font-heading', `'${theme.headingFont}'`);
    loadFont(theme.headingFont);
  }
  if (theme.bodyFont) {
    root.style.setProperty('--font-body', `'${theme.bodyFont}'`);
    loadFont(theme.bodyFont);
  }
  if (theme.radius !== undefined) root.style.setProperty('--radius', `${theme.radius}px`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && theme.background) meta.setAttribute('content', theme.background);
}

export function SiteProvider({ children }) {
  const q = useQuery({ queryKey: ['bootstrap'], queryFn: () => get('/site/bootstrap'), staleTime: 60_000 });
  const data = q.data;

  useEffect(() => {
    if (!data) return;
    applyTheme(data.settings.theme);
    if (data.settings.brand.favicon) {
      const l = document.querySelector('link[rel="icon"]');
      if (l) l.href = imgUrl(data.settings.brand.favicon, 80);
    }
    const d = document.querySelector('meta[name="description"]') || Object.assign(document.createElement('meta'), { name: 'description' });
    d.content = data.settings.seo?.description || '';
    document.head.appendChild(d);
  }, [data]);

  const value = useMemo(() => {
    if (!data) return null;
    const { settings } = data;
    const t = (key, vars) => {
      let s = settings.labels?.[key] ?? key;
      if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.replace(`{${k}}`, v)));
      return s;
    };
    return { ...data, t, fmt: (n) => money(n, settings.commerce.currency), refetch: q.refetch };
  }, [data, q.refetch]);

  if (q.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-heading text-3xl">We’ll be right back</p>
        <p className="max-w-sm text-sm text-muted">The store couldn’t reach its server. Please make sure the API is running and try again.</p>
        <button className="btn-primary mt-2" onClick={() => q.refetch()}>Retry</button>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="animate-pulse font-heading text-2xl tracking-[0.35em] text-ink">AARO</div>
      </div>
    );
  }
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export const useSite = () => useContext(SiteCtx);

export function usePageTitle(title) {
  const site = useSite();
  useEffect(() => {
    const brand = site?.settings.brand.name || '';
    document.title = title ? `${title} — ${brand}` : site?.settings.seo?.title || brand;
  }, [title, site]);
}
