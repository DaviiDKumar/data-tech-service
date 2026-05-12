import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

/**
 * Global is used here to maintain a cached connection across hot-reloads
 * in development. This prevents connections from growing exponentially.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Forces IPv4. Essential for fixing ECONNREFUSED on many local networks.
      family: 4, 
      // Gives the server more time to respond if the network is slow.
      serverSelectionTimeoutMS: 10000, 
      socketTimeoutMS: 45000,
    };

    console.log("Attempting to connect to MongoDB Atlas... ⏳");

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("DB Connected Successfully 🚀");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on failure to allow retry
    console.error("DB Connection Failed ❌");
    console.error("Error Detail:", e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;