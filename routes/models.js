import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { MODELS, COLLECTIONS } from '../constant/routes.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, rebs, next) => {
    try {
        const db = getDB();
        const { search, framework, limit, sort } = req.query;
        let query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (framework && framework !== 'all') query.framework = framework;
        let modelsQuery = db.collection(COLLECTIONS.MODELS).find(query);
        if (sort === 'oldest') modelsQuery = modelsQuery.sort({ createdAt: 1 });
        else if (sort === 'popular') modelsQuery = modelsQuery.sort({ purchased: -1 });
        else modelsQuery = modelsQuery.sort({ createdAt: -1 });
        if (limit) modelsQuery = modelsQuery.limit(parseInt(limit));
        const models = await modelsQuery.toArray();
        res.json({ success: true, count: models.length, data: models });
    } catch (error) {
        next(error);
    }
});

router.get(MODELS.FEATURED, async (req, res, next) => {
    try {
        const db = getDB();
        const models = await db.collection(COLLECTIONS.MODELS).find({}).sort({ createdAt: -1 }).limit(6).toArray();
        res.json({ success: true, count: models.length, data: models });
    } catch (error) {
        next(error);
    }
});

router.get(MODELS.MY_MODELS, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const models = await db.collection(COLLECTIONS.MODELS).find({ createdBy: req.user.email }).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, count: models.length, data: models });
    } catch (error) {
        next(error);
    }
});

router.get(MODELS.BY_ID, optionalAuth, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const model = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
        res.json({ success: true, data: model });
    } catch (error) {
        console.error('Error fetching model by ID:', error);
        next(error);
    }
});

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { name, framework, useCase, dataset, description, image } = req.body;
        if (!name || !framework || !useCase || !dataset || !description || !image) {
            return res.status(400).json({ success: false, message: 'All fields are required: name, framework, useCase, dataset, description, image' });
        }
        const newModel = {
            name: name.trim(), framework: framework.trim(), useCase: useCase.trim(),
            dataset: dataset.trim(), description: description.trim(), image: image.trim(),
            createdBy: req.user.email, createdAt: new Date(), purchased: 0
        };
        const result = await db.collection(COLLECTIONS.MODELS).insertOne(newModel);
        res.status(201).json({ success: true, message: 'Model added successfully', data: { _id: result.insertedId, ...newModel } });
    } catch (error) {
        next(error);
    }
});

router.put(MODELS.BY_ID, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { name, framework, useCase, dataset, description, image } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const existingModel = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        if (!existingModel) return res.status(404).json({ success: false, message: 'Model not found' });
        if (existingModel.createdBy !== req.user.email) return res.status(403).json({ success: false, message: 'You are not authorized to update this model' });
        if (!name || !framework || !useCase || !dataset || !description || !image) {
            return res.status(400).json({ success: false, message: 'All fields are required: name, framework, useCase, dataset, description, image' });
        }
        const updateData = {
            name: name.trim(), framework: framework.trim(), useCase: useCase.trim(),
            dataset: dataset.trim(), description: description.trim(), image: image.trim(), updatedAt: new Date()
        };
        const result = await db.collection(COLLECTIONS.MODELS).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.modifiedCount === 0) return res.status(400).json({ success: false, message: 'No changes made to the model' });
        const updatedModel = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: 'Model updated successfully', data: updatedModel });
    } catch (error) {
        next(error);
    }
});

router.delete(MODELS.BY_ID, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const existingModel = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        if (!existingModel) return res.status(404).json({ success: false, message: 'Model not found' });
        if (existingModel.createdBy !== req.user.email) return res.status(403).json({ success: false, message: 'You are not authorized to delete this model' });
        await db.collection(COLLECTIONS.MODELS).deleteOne({ _id: new ObjectId(id) });
        await db.collection(COLLECTIONS.PURCHASES).deleteMany({ modelId: id });
        res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
        next(error);
    }
});

router.post(MODELS.PURCHASE, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const model = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
        await db.collection(COLLECTIONS.MODELS).updateOne({ _id: new ObjectId(id) }, { $inc: { purchased: 1 } });
        const purchase = {
            modelId: id, modelName: model.name, framework: model.framework, useCase: model.useCase,
            image: model.image, createdBy: model.createdBy, purchasedBy: req.user.email, purchasedAt: new Date()
        };
        await db.collection(COLLECTIONS.PURCHASES).insertOne(purchase);
        const updatedModel = await db.collection(COLLECTIONS.MODELS).findOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: 'Model purchased successfully', data: updatedModel });
    } catch (error) {
        next(error);
    }
});

export default router;
