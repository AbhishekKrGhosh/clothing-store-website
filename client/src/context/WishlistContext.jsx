import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishCtx = createContext(null);
const KEY = 'aaro_wishlist_v1';
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(read);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);

  const has = useCallback((id) => items.some((i) => i._id === id), [items]);
  const toggle = useCallback((p) => {
    setItems((prev) => (prev.some((i) => i._id === p._id)
      ? prev.filter((i) => i._id !== p._id)
      : [...prev, { _id: p._id, slug: p.slug, name: p.name, price: p.price, comparePrice: p.comparePrice, images: (p.images || []).slice(0, 2), colors: (p.colors || []).map(({ name, hex }) => ({ name, hex })), gender: p.gender, sizes: p.sizes }]));
  }, []);

  const value = useMemo(() => ({ items, has, toggle, count: items.length }), [items, has, toggle]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export const useWishlist = () => useContext(WishCtx);
