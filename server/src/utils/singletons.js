import Singleton from '../models/Singleton.js';
import { defaultSettings, defaultContent, deepMerge } from './defaults.js';

const DEFAULTS = { settings: defaultSettings, content: defaultContent };

export async function getSingleton(key) {
  const doc = await Singleton.findOne({ key }).lean();
  return deepMerge(DEFAULTS[key], doc?.value || {});
}

export async function setSingleton(key, value) {
  const merged = deepMerge(DEFAULTS[key], value || {});
  await Singleton.findOneAndUpdate({ key }, { key, value: merged }, { upsert: true, new: true });
  return merged;
}
