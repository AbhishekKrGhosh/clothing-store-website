import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Img from '../../components/Img';
import Icon from '../../lib/icons';

export default function Hero({ data }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 80]);
  const words = (data.title || '').split(' ');

  return (
    <section className="relative overflow-hidden bg-bg">
      <div className="relative mx-auto max-w-[1440px]">
        {/* image */}
        <motion.div
          className="absolute inset-0 md:left-[30%]"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ y }}
        >
          <Img image={data.image} eager className="h-full w-full" sizes="(min-width:768px) 70vw, 100vw" alt={data.title} imgClassName="object-[70%_center]" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent md:bg-gradient-to-r md:from-bg md:via-bg/30 md:to-transparent" />
          {data.badgeText && (
            <motion.p
              initial={{ opacity: 0, rotate: -12 }} animate={{ opacity: 1, rotate: -8 }} transition={{ delay: 1 }}
              className="absolute right-6 top-8 max-w-[8rem] text-right font-heading text-2xl italic leading-tight text-ink/80 md:right-12 md:top-12 md:text-3xl"
            >
              {data.badgeText}
            </motion.p>
          )}
        </motion.div>

        {/* copy */}
        <div className="container relative flex min-h-[620px] flex-col justify-end pb-10 pt-64 md:min-h-[600px] md:justify-center md:pb-16 md:pt-16 lg:min-h-[640px]">
          <div className="max-w-xl">
            <h1 className="font-heading text-[2.9rem] font-medium leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
              {words.map((w, i) => (
                <motion.span
                  key={i}
                  className="mr-[0.22em] inline-block"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
              className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink/75"
            >
              {data.subtitle}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.7 }} className="mt-7 flex flex-wrap gap-3">
              {data.primaryButton?.label && (
                <Link to={data.primaryButton.url || '/shop'} className="btn-primary group">
                  {data.primaryButton.label} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {data.secondaryButton?.label && (
                <Link to={data.secondaryButton.url || '/about'} className="btn-outline bg-bg/40 backdrop-blur-sm">{data.secondaryButton.label}</Link>
              )}
            </motion.div>

            {data.features?.length > 0 && (
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.05 } } }}
                className="mt-10 grid max-w-md grid-cols-4 gap-3 md:mt-14"
              >
                {data.features.map((f, i) => (
                  <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="flex flex-col items-center gap-2 text-center">
                    <Icon name={f.icon} className="h-6 w-6 text-ink/80" />
                    <span className="text-[10px] leading-tight text-ink/75 md:text-[11px]">{f.title}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
