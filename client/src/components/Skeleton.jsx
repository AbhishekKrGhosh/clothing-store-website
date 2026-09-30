export const Sk = ({ className = '' }) => <div className={`skeleton rounded-brand ${className}`} />;

export function ProductCardSkeleton() {
  return (
    <div>
      <Sk className="aspect-[4/5] w-full" />
      <Sk className="mt-3 h-4 w-2/3" />
      <Sk className="mt-2 h-3 w-1/3" />
      <Sk className="mt-2 h-4 w-1/4" />
    </div>
  );
}

export function GridSkeleton({ count = 4, className = 'grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}
