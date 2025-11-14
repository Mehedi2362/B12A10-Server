import express from 'express';
import { getDB } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { PURCHASES, COLLECTIONS, MY_PURCHASES} from '../constant/routes.js';

const router = express.Router();

router.get(MY_PURCHASES, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const purchases = await db.collection(COLLECTIONS.PURCHASES).find({ purchasedBy: req.user.email }).sort({ purchasedAt: -1 }).toArray();
        res.json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
});

// router.get(PURCHASED_MODEL(':id'), async (req, res, next) => {
//     try {
//         const db = getDB();
//         const { id } = req.params;
//         const purchases = await db.collection(COLLECTIONS.PURCHASES).find({ modelId: id }).sort({ purchasedAt: -1 }).toArray();
//         res.json({ success: true, count: purchases.length, data: purchases });
//     } catch (error) {
//         next(error);
//     }
// });

router.get('/purchases/stats', authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const userModels = await db.collection(COLLECTIONS.MODELS).find({ createdBy: req.user.email }).toArray();
        const modelIds = userModels.map(m => m._id.toString());
        const totalPurchases = await db.collection(COLLECTIONS.PURCHASES).countDocuments({ modelId: { $in: modelIds } });
        const purchasesByModel = await db.collection(COLLECTIONS.PURCHASES).aggregate([
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
