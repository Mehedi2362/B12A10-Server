import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, '../logs.json'), 'utf8'));

export const errorHandler = (err, req, res, next) => {
    if (logsConfig.enableLogs.errorHandler) {
        console.error('Error:', err);
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ success: false, message, error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
};

export const notFoundHandler = (req, res, next) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
