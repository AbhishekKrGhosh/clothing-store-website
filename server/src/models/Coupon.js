import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = no cap
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    used: { type: Number, default: 0 },
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
    showOnSite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

couponSchema.methods.evaluate = function (subtotal) {
  const now = new Date();
  if (!this.active) return { ok: false, message: 'This coupon is not active' };
  if (this.startsAt && now < this.startsAt) return { ok: false, message: 'This coupon is not active yet' };
  if (this.expiresAt && now > this.expiresAt) return { ok: false, message: 'This coupon has expired' };
  if (this.usageLimit && this.used >= this.usageLimit) return { ok: false, message: 'This coupon has reached its usage limit' };
  if (subtotal < (this.minOrder || 0)) return { ok: false, message: `Minimum order value is ${this.minOrder}` };
  let discount = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;
  if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  discount = Math.min(Math.round(discount), subtotal);
  return { ok: true, discount };
};

export default mongoose.model('Coupon', couponSchema);
