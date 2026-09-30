import mongoose from 'mongoose';
import { ImageRef } from './shared.js';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    slug: String,
    image: ImageRef,
    price: Number,
    color: String,
    size: String,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { name: String, email: String, phone: String },
    shippingAddress: {
      line1: String, line2: String, city: String, state: String, pincode: String,
      country: { type: String, default: 'India' },
    },
    items: [itemSchema],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    couponCode: String,
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
    notes: String,
    trackingNumber: String,
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  if (this.orderNumber) return next();
  const last = await mongoose.model('Order').findOne({ orderNumber: /^AR\d+$/ }, { orderNumber: 1 }).sort({ orderNumber: -1 }).lean();
  const n = last?.orderNumber ? parseInt(last.orderNumber.replace(/\D/g, ''), 10) + 1 : 100001;
  this.orderNumber = `AR${n}`;
  next();
});

export default mongoose.model('Order', orderSchema);
