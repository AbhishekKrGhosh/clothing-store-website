import { Link } from 'react-router-dom';
import { usePageTitle } from '../context/SiteContext';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-heading text-8xl text-primary/80">404</p>
      <h1 className="mt-2 font-heading text-3xl">This page wandered off</h1>
      <p className="mt-2 text-sm text-muted">Let’s get you back to something lovely.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
