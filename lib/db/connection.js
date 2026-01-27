import mongoose from 'mongoose';
import { logger } from '@/lib/utils/logger.js';

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // Check MONGODB_URI lazily (when function is called, not at module load)
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '20', 10), // Maximum connections (default 20)
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10), // Minimum connections (default 5)
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      connectTimeoutMS: 10000, // Connection timeout
      serverSelectionTimeoutMS: 5000, // Server selection timeout
      socketTimeoutMS: 45000, // Socket timeout
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
      // Performance optimizations
      retryWrites: true, // Retry write operations
      retryReads: true, // Retry read operations on network errors
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

