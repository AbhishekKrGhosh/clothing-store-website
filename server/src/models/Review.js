import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    comment: String,
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.statics.recalc = async function (productId) {
  const Product = mongoose.model('Product');
  const [agg] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), approved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    numReviews: agg ? agg.n : 0,
  });
};

export default mongoose.model('Review', reviewSchema);
