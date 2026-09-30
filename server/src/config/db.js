import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<user>')) {
    console.error('\n✖ MONGODB_URI is missing. Add your MongoDB connection string to server/.env\n');
    process.exit(1);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✔ MongoDB connected (${mongoose.connection.name})`);
}
