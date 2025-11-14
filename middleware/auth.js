import { verifyToken } from '../config/firebase-admin.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided. Authorization header must be in format: Bearer <token>' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyToken(idToken);
        req.user = { uid: decodedToken.uid, email: decodedToken.email, name: decodedToken.name || decodedToken.email };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            const decodedToken = await verifyToken(idToken);
            req.user = { uid: decodedToken.uid, email: decodedToken.email, name: decodedToken.name || decodedToken.email };
        }
        next();
    } catch (error) {
        next();
    }
};
