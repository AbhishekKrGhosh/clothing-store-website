import mongoose from 'mongoose';
import { ImageRef } from './shared.js';

const colorSchema = new mongoose.Schema(
  { name: String, hex: String, images: [ImageRef] },
  { _id: false }
);
const sizeSchema = new mongoose.Schema(
  { label: String, stock: { type: Number, default: 0 } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    sku: String,
    shortDescription: String,
    description: String,
    highlights: [String],
    fabric: String,
    care: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    gender: { type: String, enum: ['Men', 'Women', 'Unisex', 'Kids'], default: 'Unisex' },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0 },
    images: [ImageRef],
    colors: [colorSchema],
    sizes: [sizeSchema],
    tags: [String],
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('totalStock').get(function () {
  return (this.sizes || []).reduce((s, x) => s + (x.stock || 0), 0);
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ active: 1, category: 1, gender: 1, price: 1 });

export default mongoose.model('Product', productSchema);
