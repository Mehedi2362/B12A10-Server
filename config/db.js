import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config.js';

let db = null;
let client = null;

export const connectDB = async () => {
    try {
        if (db) return db;
        const URI = process.env.MONGODB_URI;
        if (!URI) throw new Error('MONGODB_URI is not defined in environment variables');

        client = new MongoClient(URI, {
            serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
        });
        await client.connect();

        await client.db('admin').command({ ping: 1 });
        db = client.db(process.env.DB_NAME || 'ai-model-inventory');
        console.log('✅ Successfully connected to MongoDB!');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export const getDB = () => {
    if (!db) throw new Error('Database not initialized. Call connectDB first.');
    return db;
};

export const closeDB = async () => {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('MongoDB connection closed');
    }
};
