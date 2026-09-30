import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { get } from '../lib/api';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { Sk } from '../components/Skeleton';
import { fadeUp, stagger } from '../components/Reveal';
import { fmtDate } from '../lib/format';

export default function Journal() {
  const { content } = useSite();
  usePageTitle(content.journal.title);
  const { data, isLoading } = useQuery({ queryKey: ['posts'], queryFn: () => get('/posts') });
  const [first, ...rest] = data || [];

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-heading text-5xl md:text-6xl">{content.journal.title}</h1>
      <p className="mt-2 text-muted">{content.journal.subtitle}</p>

      {isLoading && <div className="mt-10 grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <Sk key={i} className="aspect-[4/3]" />)}</div>}
      {data?.length === 0 && <p className="mt-10 text-muted">No stories yet.</p>}

      {first && (
        <Link to={`/journal/${first.slug}`} className="group mt-10 grid items-center gap-6 md:grid-cols-2 md:gap-12">
          <Img image={first.cover} eager className="aspect-[4/3] w-full rounded-[calc(var(--radius)*1.6)]" imgClassName="group-hover:scale-105" sizes="(min-width:768px) 50vw, 100vw" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{fmtDate(first.publishedAt)}</p>
            <h2 className="mt-3 font-heading text-4xl leading-tight group-hover:text-primary">{first.title}</h2>
            <p className="mt-3 text-ink/75">{first.excerpt}</p>
            <span className="link-arrow mt-5">Read story →</span>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <motion.div key={p._id} variants={fadeUp}>
              <Link to={`/journal/${p.slug}`} className="group block">
                <Img image={p.cover} className="aspect-[4/3] w-full rounded-brand" imgClassName="group-hover:scale-105" sizes="(min-width:1024px) 33vw, 50vw" />
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted">{fmtDate(p.publishedAt)}</p>
                <h3 className="mt-2 font-heading text-2xl group-hover:text-primary">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
