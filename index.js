require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { initializeFirebaseAdmin } = require('./config/firebase-admin');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { BASE } = require('./constant/routes');

const modelsRouter = require('./routes/models');
const purchasesRouter = require('./routes/purchases');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`); next(); });

app.get('/', (req, res) => res.json({ success: true, message: 'AI Model Inventory Manager API', version: '1.0.0', endpoints: { models: `${BASE}/models`, purchases: `${BASE}/purchases`, health: '/health' } }));
app.get('/health', (req, res) => res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() }));

app.use(`${BASE}/models`, modelsRouter);
app.use(`${BASE}/purchases`, purchasesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    try {
        initializeFirebaseAdmin();
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

const shutdown = async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    const { closeDB } = require('./config/db');
    await closeDB();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
