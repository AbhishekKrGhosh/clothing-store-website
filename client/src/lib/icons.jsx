import {
  Leaf, HeartHandshake, Package, MapPin, Truck, RotateCcw, ShieldCheck, Sprout, Wheat, Droplets, Factory,
  Sparkles, Heart, Recycle, Sun, Flower2, Shirt, Scissors, Gift, Star, Award, BadgeCheck, Globe, Handshake,
  Hand, Home, Mountain, Palette, Smile, Tag, Trees, Wind, Zap, Clock, CreditCard, Headphones, Lock, Feather,
  Gem, Waves, Instagram, Facebook, Twitter, Youtube, Mail, Phone,
} from 'lucide-react';

// Curated icon set — keep in sync with admin/src/lib/icons.jsx
export const ICONS = {
  Leaf, HeartHandshake, Package, MapPin, Truck, RotateCcw, ShieldCheck, Sprout, Wheat, Droplets, Factory,
  Sparkles, Heart, Recycle, Sun, Flower2, Shirt, Scissors, Gift, Star, Award, BadgeCheck, Globe, Handshake,
  Hand, Home, Mountain, Palette, Smile, Tag, Trees, Wind, Zap, Clock, CreditCard, Headphones, Lock, Feather,
  Gem, Waves, Instagram, Facebook, Twitter, Youtube, Mail, Phone,
};

export default function Icon({ name, ...props }) {
  const Cmp = ICONS[name] || Sparkles;
  return <Cmp strokeWidth={1.4} {...props} />;
}
