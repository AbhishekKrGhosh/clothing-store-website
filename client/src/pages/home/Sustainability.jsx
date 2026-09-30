import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Img from '../../components/Img';
import Reveal from '../../components/Reveal';
import Icon from '../../lib/icons';

export default function Sustainability({ data }) {
  return (
    <section className="container section">
      <Reveal className="relative overflow-hidden rounded-[calc(var(--radius)*1.6)] bg-surface-alt">
        <div className="absolute inset-0 md:left-[35%]">
          <Img image={data.image} alt={data.title} className="h-full w-full" sizes="(min-width:768px) 65vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-alt via-surface-alt/70 to-transparent md:bg-gradient-to-r md:from-surface-alt md:via-surface-alt/40 md:to-transparent" />
        </div>
        <div className="relative flex min-h-[460px] flex-col justify-end p-6 pt-56 md:min-h-[420px] md:justify-center md:p-12">
          <div className="max-w-md">
            <h2 className="font-heading text-4xl font-medium leading-[1.05] md:text-5xl">{data.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/75 md:text-[15px]">{data.text}</p>
            {data.button?.label && (
              <Link to={data.button.url || '/about'} className="btn-dark group mt-6">
                {data.button.label} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
          {data.features?.length > 0 && (
            <motion.div
              className="mt-10 grid max-w-xl grid-cols-4 gap-3 md:absolute md:bottom-8 md:right-10 md:mt-0 md:max-w-lg"
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
            >
              {data.features.map((f, i) => (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/70 backdrop-blur"><Icon name={f.icon} className="h-5 w-5" /></span>
                  <span className="text-[10px] leading-tight md:text-[11px]">{f.title}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
