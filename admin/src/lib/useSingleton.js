import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { get, put } from './api';

// Loads settings/content, keeps a local draft and saves the whole document.
export default function useSingleton(key) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: [key], queryFn: () => get(`/site/${key}`) });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);

  const dirty = useMemo(() => !!data && !!draft && JSON.stringify(data) !== JSON.stringify(draft), [data, draft]);

  // set('home.hero.title', value)
  const set = (path, value) => setDraft((d) => {
    const next = structuredClone(d);
    const keys = path.split('.');
    let o = next;
    keys.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
    return next;
  });
  const getv = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), draft);

  const save = async () => {
    setSaving(true);
    try {
      const res = await put(`/site/${key}`, draft);
      qc.setQueryData([key], res);
      toast.success('Saved — changes are live on your store');
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const reset = () => setDraft(structuredClone(data));
  return { draft, set, get: getv, dirty, save, saving, reset, isLoading: isLoading || !draft };
}
