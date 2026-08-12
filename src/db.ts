import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (db) return db;

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is missing in .env");

    const dbName = process.env.MONGODB_DB_NAME || "plexbot";

    client = new MongoClient(uri);
    await client.connect();

    db = client.db(dbName);

    console.log("[db] Connected to MongoDB, database:", dbName);

    return db;
}

export async function closeDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}