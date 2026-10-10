import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_CONNECTION_STRING is not defined in environment variables");
}

/** 
 * Global is used here to cache the connection across hot reloads in development
 * and to prevent multiple connections in serverless environments (Vercel, etc.)
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) {
    // ✅ Use existing connection
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // disables mongoose buffering for faster startup
      maxPoolSize: 5,        // limit connection pool size for serverless
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }

  return cached.conn;
}
