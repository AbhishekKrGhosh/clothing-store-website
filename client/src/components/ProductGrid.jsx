import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { fadeUp, stagger } from './Reveal';

export default function ProductGrid({ products = [], className = 'grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 lg:grid-cols-4', eagerCount = 0 }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
      {products.map((p, i) => (
        <motion.div key={p._id} variants={fadeUp}>
          <ProductCard product={p} eager={i < eagerCount} />
        </motion.div>
      ))}
    </motion.div>
  );
}
