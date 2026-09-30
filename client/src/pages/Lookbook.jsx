import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSite, usePageTitle } from '../context/SiteContext';
import Img from '../components/Img';
import Modal from '../components/Modal';

export default function Lookbook() {
  const { content } = useSite();
  const lb = content.lookbook;
  usePageTitle(lb.title);
  const [open, setOpen] = useState(null);

  return (
    <div className="container py-10 md:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <h1 className="font-heading text-5xl md:text-6xl">{lb.title}</h1>
        <p className="mt-3 text-muted">{lb.subtitle}</p>
      </motion.div>
      <div className="mt-10 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {lb.items?.map((it, i) => (
          <motion.button
            key={i}
            onClick={() => setOpen(it)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-brand text-left"
          >
            <div style={{ aspectRatio: it.image?.w && it.image?.h ? `${it.image.w}/${it.image.h}` : '4/5' }}>
              <Img image={it.image} className="h-full w-full" imgClassName="group-hover:scale-105" sizes="(min-width:768px) 33vw, 50vw" />
            </div>
            {it.caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 font-heading text-lg italic text-white opacity-0 transition group-hover:opacity-100">{it.caption}</p>}
          </motion.button>
        ))}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} className="max-w-3xl">
        {open && (
          <>
            <div style={{ aspectRatio: open.image?.w && open.image?.h ? `${open.image.w}/${open.image.h}` : '4/5' }} className="max-h-[70vh] w-full">
              <Img image={open.image} className="h-full w-full rounded-brand" fit="contain" sizes="800px" />
            </div>
            {open.caption && <p className="mt-4 font-heading text-2xl italic">{open.caption}</p>}
            {open.link && <Link to={open.link} onClick={() => setOpen(null)} className="btn-primary mt-4">Shop the look</Link>}
          </>
        )}
      </Modal>
    </div>
  );
}
