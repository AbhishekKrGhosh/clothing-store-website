import mongoose from 'mongoose';
import { ImageRef } from './shared.js';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: String,
    content: String,
    cover: ImageRef,
    author: String,
    tags: [String],
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);
