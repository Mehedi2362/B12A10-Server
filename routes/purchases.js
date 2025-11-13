const express = require('express');
const { getDB } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { PURCHASES, COLLECTIONS } = require('../constant/routes');

const router = express.Router();

router.get(PURCHASES.MY_PURCHASES, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const purchases = await db.collection(COLLECTIONS.PURCHASES).find({ purchasedBy: req.user.email }).sort({ purchasedAt: -1 }).toArray();
        res.json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
});

router.get(PURCHASES.BY_MODEL, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { modelId } = req.params;
        const purchases = await db.collection(COLLECTIONS.PURCHASES).find({ modelId }).sort({ purchasedAt: -1 }).toArray();
        res.json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
});

router.get(PURCHASES.STATS, authMiddleware, async (req, res, next) => {
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

module.exports = router;
