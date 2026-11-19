import { MongoClient, type Db } from "mongodb";

/**
 * One MongoClient per Node process, reused by every route handler.
 * This is a single Next.js server, so the driver's default pool (100)
 * is enough and we do not override it. Creating the client outside the
 * handler also keeps warm serverless instances from opening a new
 * connection on every request.
 */
const globalForMongo = globalThis as unknown as { mongoPromise?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForMongo.mongoPromise) {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coinly";
    const client = new MongoClient(uri);
    globalForMongo.mongoPromise = client.connect().then(() => client.db()).catch((error) => {
      globalForMongo.mongoPromise = undefined;
      throw error;
    });
  }
  return globalForMongo.mongoPromise;
}
