import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, '../logs.json'), 'utf8'));

let db = null;
let client = null;

// Establishes connection to MongoDB and returns database instance
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
        if (logsConfig.enableLogs.database) {
            console.log('✅ Successfully connected to MongoDB!');
        }
        return db;
    } catch (error) {
        if (logsConfig.enableLogs.database) {
            console.error('❌ MongoDB connection error:', error);
        }
        throw error;
    }
};

// Returns the active database instance or throws error if not initialized
export const getDB = () => {
    if (!db) throw new Error('Database not initialized. Call connectDB first.');
    return db;
};

// Closes the MongoDB connection and cleans up resources
export const closeDB = async () => {
    if (client) {
        await client.close();
        db = null;
        client = null;
        if (logsConfig.enableLogs.database) {
            console.log('MongoDB connection closed');
        }
    }
};
