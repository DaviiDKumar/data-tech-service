import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

/**
 * Next.js mein hot-reloading ki wajah se connections leak na hon, 
 * isliye hum connection ko "global" variable mein cache karte hain.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 1. Agar connection pehle se cache mein hai, toh wahi return karo (Fast)
  if (cached.conn) {
    return cached.conn;
  }

  // 2. Agar koi connection request pehle se line mein nahi hai, toh naya shuru karo
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Turant error de agar DB down ho
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("DB Connected Successfully 🚀");
      return mongoose;
    });
  }

  // 3. Connection ka wait karo aur save kar lo
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Error aaye toh promise clear karo taaki next attempt ho sake
    console.error("DB Connection Failed ❌", e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;