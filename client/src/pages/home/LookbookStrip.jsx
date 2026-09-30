import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Img from '../../components/Img';
import SectionHeader from '../../components/SectionHeader';
import { fadeUp, stagger } from '../../components/Reveal';
import { useSite } from '../../context/SiteContext';

export default function LookbookStrip({ data }) {
  const { content } = useSite();
  const items = (content.lookbook?.items || []).slice(0, data.limit || 4);
  if (!items.length) return null;
  return (
    <section className="container section">
      <SectionHeader title={data.title} subtitle={data.subtitle} linkLabel={data.linkLabel} linkUrl={data.linkUrl} />
      <motion.div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
        {items.map((it, i) => {
          const inner = (
            <>
              <Img image={it.image} alt={it.caption} className={`w-full ${i === 0 ? 'aspect-[5/4] md:aspect-[4/3]' : 'aspect-[5/4] md:aspect-[4/3]'}`} imgClassName="group-hover:scale-105" sizes="(min-width:768px) 25vw, 50vw" maxWidth={800} />
              {it.caption && (
                <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="font-heading text-lg italic text-white">{it.caption}</p>
                </div>
              )}
            </>
          );
          return (
            <motion.div key={i} variants={fadeUp} className="group relative overflow-hidden rounded-brand">
              {it.link ? <Link to={it.link}>{inner}</Link> : inner}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
