import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);
const KEY = 'aaro_cart_v1';
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(read);
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState(() => localStorage.getItem('aaro_coupon') || '');

  useEffect(() => (coupon ? localStorage.setItem('aaro_coupon', coupon) : localStorage.removeItem('aaro_coupon')), [coupon]);

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);

  const add = useCallback((product, { color, colorHex, size, qty = 1, image, maxStock = 99 }) => {
    const key = `${product._id}|${color || ''}|${size || ''}`;
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, maxStock) } : i));
      return [...prev, {
        key, productId: product._id, slug: product.slug, name: product.name, price: product.price,
        image: image || product.images?.[0] || null, color, colorHex, size, qty: Math.min(qty, maxStock), maxStock,
      }];
    });
  }, []);

  const update = useCallback((key, qty) => setItems((p) => p.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock || 99)) } : i))), []);
  const remove = useCallback((key) => setItems((p) => p.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => { setItems([]); setCoupon(''); }, []);

  const value = useMemo(() => ({
    items, add, update, remove, clear, open, setOpen, coupon, setCoupon,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items, add, update, remove, clear, open, coupon]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
