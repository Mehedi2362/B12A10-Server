import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let firebaseApp = null;

export const initializeFirebaseAdmin = () => {
    try {
        if (firebaseApp) return firebaseApp;
        const serviceAccountPath = path.join(__dirname, '../firebase-adminsdk.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('✅ Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization error:', error);
        throw error;
    }
};

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
