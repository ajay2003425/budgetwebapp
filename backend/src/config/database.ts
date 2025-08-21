import mongoose from 'mongoose';
import { env } from './env';

let retryCount = 0;
const maxRetries = 5;
const retryDelay = 5000;

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log('✅ MongoDB connected successfully');
    retryCount = 0;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`⏳ Retrying connection... (${retryCount}/${maxRetries})`);
      setTimeout(connectDatabase, retryDelay * retryCount);
    } else {
      console.error('💀 Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed through app termination');
  process.exit(0);
});