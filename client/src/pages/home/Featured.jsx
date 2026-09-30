import { useQuery } from '@tanstack/react-query';
import { get } from '../../lib/api';
import SectionHeader from '../../components/SectionHeader';
import ProductGrid from '../../components/ProductGrid';
import { GridSkeleton } from '../../components/Skeleton';

const paramsFor = (d) => {
  const limit = d.limit || 4;
  if (d.source === 'manual' && d.productIds?.length) return { ids: d.productIds.join(','), keepOrder: 1, limit: d.productIds.length };
  if (d.source === 'new') return { newArrival: 'true', sort: 'new', limit };
  if (d.source === 'bestseller') return { sort: 'popular', limit };
  return { featured: 'true', limit };
};

export default function Featured({ data }) {
  const params = paramsFor(data);
  const { data: res, isLoading } = useQuery({ queryKey: ['products', params], queryFn: () => get('/products', params) });
  const cols = (data.limit || 4) % 3 === 0 && (data.limit || 4) % 4 !== 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  return (
    <section className="container section">
      <SectionHeader title={data.title} subtitle={data.subtitle} linkLabel={data.linkLabel} linkUrl={data.linkUrl} />
      {isLoading ? <GridSkeleton count={data.limit || 4} /> : (
        <ProductGrid products={res?.items || []} className={`grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 ${cols}`} />
      )}
    </section>
  );
}
