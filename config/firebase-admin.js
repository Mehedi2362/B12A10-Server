const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebaseAdmin = () => {
    try {
        if (firebaseApp) return firebaseApp;
        const serviceAccount = require(path.join(__dirname, '../firebase-adminsdk.json'));
        firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('✅ Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization error:', error);
        throw error;
    }
};

const verifyToken = async (idToken) => {
    try {
        if (!firebaseApp) initializeFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = { initializeFirebaseAdmin, verifyToken, admin };
