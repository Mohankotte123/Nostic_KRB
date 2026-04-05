import mongoose from "mongoose";

declare global {
  var mongooseConn:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cache = global.mongooseConn ?? { conn: null, promise: null };
global.mongooseConn = cache;

function normalizeMongoUri(raw: string): string {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Atlas works more reliably with retryWrites + w=majority when not already present. */
function withAtlasDefaults(uri: string): string {
  if (!uri.startsWith("mongodb+srv://")) return uri;
  if (/[?&]retryWrites=/.test(uri)) return uri;
  const sep = uri.includes("?") ? "&" : "?";
  return `${uri}${sep}retryWrites=true&w=majority`;
}

function getMongoUri(): string | undefined {
  const raw =
    process.env.MONGODB_URI?.trim() ||
    process.env.NEXT_PUBLIC_MONGODB_URI?.trim();
  if (!raw) return undefined;
  return withAtlasDefaults(normalizeMongoUri(raw));
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      "MongoDB URI is not set. Add MONGODB_URI to .env.local (server-only; preferred). " +
        "NEXT_PUBLIC_MONGODB_URI is also accepted but embeds the string in client builds — avoid in production. " +
        "See .env.example.",
    );
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15_000,
    });
  }
  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    cache.promise = null;
    cache.conn = null;
    throw err;
  }
}
