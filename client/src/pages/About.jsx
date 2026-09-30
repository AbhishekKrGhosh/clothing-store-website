import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import Icon from '../lib/icons';

export default function About() {
  const { content } = useSite();
  const a = content.about;
  usePageTitle(a.title);
  return (
    <div>
      <section className="relative overflow-hidden">
        <motion.div initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.5 }} className="absolute inset-0">
          <Img image={a.image} eager className="h-full w-full" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />
        </motion.div>
        <div className="container relative flex min-h-[58vh] flex-col justify-end pb-12 text-white">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="font-heading text-5xl md:text-7xl">{a.title}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3 font-heading text-xl italic text-white/85 md:text-2xl">{a.subtitle}</motion.p>
        </div>
      </section>

      <section className="container max-w-3xl py-16 text-center md:py-24">
        <Reveal><p className="font-heading text-2xl leading-relaxed md:text-[1.9rem]">{a.intro}</p></Reveal>
      </section>

      {a.blocks?.map((b, i) => (
        <section key={i} className="container grid items-center gap-8 pb-16 md:grid-cols-2 md:gap-16 md:pb-24">
          <Reveal className={i % 2 ? 'md:order-2' : ''}>
            <Img image={b.image} className="aspect-[4/3] w-full rounded-[calc(var(--radius)*1.6)]" sizes="(min-width:768px) 50vw, 100vw" />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title">{b.title}</h2>
            <p className="mt-4 leading-relaxed text-ink/75">{b.text}</p>
          </Reveal>
        </section>
      ))}

      {a.values?.length > 0 && (
        <section className="bg-surface-alt/60 py-16">
          <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
            {a.values.map((v, i) => (
              <Reveal key={i} delay={i * 0.08} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bg"><Icon name={v.icon} className="h-6 w-6" /></span>
                <p className="mt-4 font-heading text-xl">{v.title}</p>
                <p className="mt-1 text-sm text-muted">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="container py-16 text-center">
        <Link to="/shop" className="btn-primary">Explore the collection <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
}
