import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  }
}

let mongooseCache = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }
  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  try{
    mongooseCache.conn = await mongooseCache.promise;
  }
  catch(error){
    mongooseCache.promise = null;
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }

  console.info("Successfully connected to MongoDB");
  return mongooseCache.conn;  
}
