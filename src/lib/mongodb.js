import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_CONNECTION_STRING is not set in environment variables.');
}
let cached = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}
export async function connectToDatabase() {
    if (!MONGODB_URI) {
        throw new Error('Please define MONGODB_CONNECTION_STRING in your .env file');
    }
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        };
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            console.log('✅ Connected to MongoDB (Crossbar Metro Arena database)');
            return m;
        });
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB Connection Error:', e);
        throw e;
    }
    return cached.conn;
}
export default connectToDatabase;
