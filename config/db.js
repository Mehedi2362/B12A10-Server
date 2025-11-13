const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); 
let db = null;
let client = null;

const connectDB = async () => {
    try {
        if (db) return db;
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');
        client = new MongoClient(uri, {
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

const getDB = () => {
    if (!db) throw new Error('Database not initialized. Call connectDB first.');
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        db = null;
        client = null;
        console.log('MongoDB connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB };
