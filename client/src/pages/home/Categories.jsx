import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Img from '../../components/Img';
import SectionHeader from '../../components/SectionHeader';
import { fadeUp, stagger } from '../../components/Reveal';
import { useSite } from '../../context/SiteContext';

export default function Categories({ data }) {
  const { categories } = useSite();
  const list = categories.filter((c) => c.showOnHome).slice(0, data.limit || 6);
  if (!list.length) return null;
  return (
    <section className="container section">
      <SectionHeader title={data.title} subtitle={data.subtitle} linkLabel={data.linkLabel} linkUrl={data.linkUrl} />
      <motion.div
        className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        {list.map((c) => (
          <motion.div key={c._id} variants={fadeUp} className="w-[38%] shrink-0 snap-start sm:w-auto">
            <Link to={c.link || `/shop?category=${c.slug}`} className="group block rounded-brand bg-surface p-1.5 pb-3 shadow-[0_1px_0_rgb(var(--c-border))] transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/5">
              <Img image={c.image} alt={c.name} className="aspect-[4/5] w-full rounded-[calc(var(--radius)-4px)]" imgClassName="group-hover:scale-105" sizes="(min-width:1024px) 16vw, 38vw" maxWidth={640} />
              <p className="mt-3 px-1.5 text-sm">{c.name}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
