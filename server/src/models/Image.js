import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    name: String,
    mime: { type: String, default: 'image/webp' },
    data: { type: String, required: true, select: false }, // base64
    width: Number,
    height: Number,
    size: Number,
    preset: String,
    blur: String,
  },
  { timestamps: true }
);

export default mongoose.model('Image', imageSchema);
