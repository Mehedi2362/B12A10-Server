import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { connectDB, closeDB } from './config/db.js';
import { initializeFirebaseAdmin } from './config/firebase-admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { BASE } from './constant/routes.js';
import modelsRouter from './routes/models.js';
import purchasesRouter from './routes/purchases.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './middleware/logger.js';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, 'logs.json'), 'utf8'));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use((req, res, next) => { console.log(`${new Date().toISOString()} - ${req.method} ${req.path} ${__dirname}`); next(); });
app.use(logger);

app.get('/', (req, res) => res.json({ success: true, message: 'AI Model Inventory Manager API', version: '1.0.0', endpoints: { models: `${BASE}/models`, purchases: `${BASE}/purchases`, health: '/health' } }));
app.get('/health', (req, res) => res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() }));

app.use(`${BASE}/`, modelsRouter);
app.use(`${BASE}/`, purchasesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    try {
        initializeFirebaseAdmin();
        await connectDB();
        app.listen(PORT, () => {
            if (logsConfig.enableLogs.server) {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
            }
        });
    } catch (error) {
        if (logsConfig.enableLogs.server) {
            console.error('Failed to start server:', error);
        }
        process.exit(1);
    }
};

const shutdown = async () => {
    if (logsConfig.enableLogs.server) {
        console.log('\n⏹️  Shutting down gracefully...');
    }
    await closeDB();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
