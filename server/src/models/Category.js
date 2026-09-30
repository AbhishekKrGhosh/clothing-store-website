import mongoose from 'mongoose';
import { ImageRef } from './shared.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    link: { type: String, default: '' }, // optional custom URL (e.g. /shop?gender=Women)
    image: ImageRef,
    banner: ImageRef,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: true },
    showInFilters: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
