import mongoose from 'mongoose';
import { Mixed } from './shared.js';

// Stores site-wide Settings and page Content as flexible documents keyed by name.
const singletonSchema = new mongoose.Schema(
  { key: { type: String, unique: true, required: true }, value: { type: Mixed, default: {} } },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Singleton', singletonSchema);
