import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { get } from '../lib/api';
import { usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import { Sk } from '../components/Skeleton';
import { fmtDate } from '../lib/format';

export default function Post() {
  const { slug } = useParams();
  const { data: p, isLoading, isError } = useQuery({ queryKey: ['post', slug], queryFn: () => get(`/posts/${slug}`) });
  usePageTitle(p?.title);

  if (isError) return <div className="container py-28 text-center"><p className="font-heading text-4xl">Story not found</p><Link to="/journal" className="btn-outline mt-6">Back to journal</Link></div>;
  if (isLoading) return <div className="container max-w-3xl space-y-4 py-14"><Sk className="h-12 w-3/4" /><Sk className="aspect-[16/9] w-full" /><Sk className="h-40 w-full" /></div>;

  return (
    <article className="container max-w-3xl py-10 md:py-14">
      <Link to="/journal" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Journal</Link>
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{fmtDate(p.publishedAt)}{p.author && ` · ${p.author}`}</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight md:text-6xl">{p.title}</h1>
        {p.excerpt && <p className="mt-4 text-lg text-ink/70">{p.excerpt}</p>}
      </motion.header>
      <Img image={p.cover} eager className="mt-8 aspect-[16/9] w-full rounded-[calc(var(--radius)*1.6)]" sizes="(min-width:768px) 768px, 100vw" />
      <div className="prose-aaro mt-10 text-[17px]">
        {(p.content || '').split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
      </div>
    </article>
  );
}
