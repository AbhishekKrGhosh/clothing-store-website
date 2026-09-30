import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useSite, usePageTitle } from '../context/SiteContext';
import ProductGrid from '../components/ProductGrid';

export default function Wishlist() {
  const { items } = useWishlist();
  const { t } = useSite();
  usePageTitle(t('wishlistTitle'));
  return (
    <div className="container py-10 md:py-14">
      <h1 className="mb-8 font-heading text-4xl md:text-5xl">{t('wishlistTitle')}</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Heart size={44} strokeWidth={1} className="text-muted" />
          <p className="mt-4 max-w-sm text-sm text-muted">{t('wishlistEmpty')}</p>
          <Link to="/shop" className="btn-primary mt-6">{t('continueShopping')}</Link>
        </div>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
