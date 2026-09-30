import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Img from './Img';
import Price from './Price';
import { ColorPicker, SizePicker } from './VariantPicker';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';

export default function QuickAdd({ product, open, onClose }) {
  const { add, setOpen } = useCart();
  const { t } = useSite();
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    if (open) {
      setColor(product.colors?.[0] || null);
      const inStock = (product.sizes || []).filter((s) => s.stock > 0);
      setSize(inStock.length === 1 ? inStock[0] : null);
    }
  }, [open, product]);

  const submit = () => {
    if (product.sizes?.length && !size) return toast.error('Please select a size');
    add(product, { color: color?.name, colorHex: color?.hex, size: size?.label, qty: 1, maxStock: size?.stock ?? 99 });
    toast.success(t('addedToBag'));
    onClose();
    setTimeout(() => setOpen(true), 250);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="grid gap-5 sm:grid-cols-[180px,1fr]">
        <Img image={product.images?.[0]} className="aspect-[4/5] w-full rounded-brand" sizes="180px" />
        <div className="space-y-5">
          <div>
            <h3 className="font-heading text-2xl leading-tight">{product.name}</h3>
            <Price price={product.price} compare={product.comparePrice} className="mt-1" />
          </div>
          <ColorPicker colors={product.colors} value={color?.name} onChange={setColor} />
          <SizePicker sizes={product.sizes} value={size?.label} onChange={setSize} />
          <div className="flex flex-col gap-2">
            <button className="btn-primary w-full" onClick={submit}>{t('addToBag')}</button>
            <Link to={`/product/${product.slug}`} onClick={onClose} className="text-center text-xs text-muted underline-offset-4 hover:underline">View full details</Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
