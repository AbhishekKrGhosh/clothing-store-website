import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { post } from '../lib/api';
import { useSite } from '../context/SiteContext';

export default function NewsletterForm({ placeholder, buttonLabel, dark = false }) {
  const { t } = useSite();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post('/subscribers', { email });
      toast.success(t('newsletterSuccess'));
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`flex w-full max-w-md items-center rounded-full p-1 ${dark ? 'bg-white' : 'border border-line bg-surface'}`}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder || 'Enter your email'}
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink placeholder:text-muted"
      />
      <button disabled={busy} className="btn-primary shrink-0 px-5 py-2.5 text-xs">
        {buttonLabel || 'Subscribe'} <ArrowRight size={14} />
      </button>
    </form>
  );
}
