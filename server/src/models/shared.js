import mongoose from 'mongoose';

// Reference to an image stored in the Image collection (base64 WebP)
export const ImageRef = new mongoose.Schema(
  { id: String, url: String, blur: String, w: Number, h: Number, alt: String },
  { _id: false }
);

export const Mixed = mongoose.Schema.Types.Mixed;
