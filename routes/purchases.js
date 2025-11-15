import express from 'express';
import { getDB } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { MODELS, MY_PURCHASES, PURCHASES } from '../constant/routes.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all purchases made by the authenticated user, sorted by most recent
router.get(MY_PURCHASES, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        let ids = await db.collection(PURCHASES).find({ purchasedBy: req.user.email }).sort({ purchasedAt: -1 }).project({ modelId: 1}).toArray(); console.log(ids);
        ids = ids.map(id => new ObjectId(id.modelId));
        const purchases = await db.collection(MODELS).find({ _id: { $in: ids } }).toArray(); console.log(purchases);

        res.json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
});

// router.get(PURCHASED_MODEL(':id'), async (req, res, next) => {
//     try {
//         const db = getDB();
//         const { id } = req.params;
//         const purchases = await db.collection(PURCHASES).find({ modelId: id }).sort({ purchasedAt: -1 }).toArray();
//         res.json({ success: true, count: purchases.length, data: purchases });
//     } catch (error) {
//         next(error);
//     }
// });

// Get purchase statistics for the user's created models
router.get('/purchases/stats', authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const userModels = await db.collection(MODELS).find({ createdBy: req.user.email }).toArray();
        const modelIds = userModels.map(m => m._id.toString());
        const totalPurchases = await db.collection(PURCHASES).countDocuments({ modelId: { $in: modelIds } });
        const purchasesByModel = await db.collection(PURCHASES).aggregate([
            { $match: { modelId: { $in: modelIds } } },
            { $group: { _id: '$modelId', count: { $sum: 1 }, modelName: { $first: '$modelName' } } },
            { $sort: { count: -1 } }
        ]).toArray();
        res.json({ success: true, data: { totalModels: userModels.length, totalPurchases, purchasesByModel } });
    } catch (error) {
        next(error);
    }
});

export default router;
