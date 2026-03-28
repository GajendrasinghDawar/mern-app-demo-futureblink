import mongoose from 'mongoose';
import { env } from './env.ts';

export const connectMongo = async (): Promise<void> => {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not set. Save endpoint will fail until it is configured.');
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB error';
    console.error('MongoDB connection failed:', message);
  }
};
