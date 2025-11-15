import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, '../logs.json'), 'utf8'));

let firebaseApp = null;

// Initializes Firebase Admin SDK with service account credentials
export const initializeFirebaseAdmin = () => {
    try {
        if (firebaseApp) return firebaseApp;

        const decoded = Buffer.from(process.env.FIREBASE_ADMIN_SDK_JSON, "base64").toString("utf8");
        const serviceAccount = JSON.parse(decoded);

        firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        if (logsConfig.enableLogs.firebase) {
            console.log('✅ Firebase Admin SDK initialized successfully');
        }
        return firebaseApp;
    } catch (error) {
        if (logsConfig.enableLogs.firebase) {
            console.error('❌ Firebase Admin SDK initialization error:', error);
        }
        throw error;
    }
};

// Verifies Firebase ID token and returns decoded user information
export const verifyToken = async (idToken) => {
    try {
        if (!firebaseApp) initializeFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export { admin };
