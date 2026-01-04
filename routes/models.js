// #API: Express router for AI model CRUD operations
// #CRUD: Complete REST API implementation for models
// #AUTH: Firebase Admin SDK authentication for protected routes
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { ALL_MODELS, MODEL_DETAILS, DELETE_MODEL, ADD_MODEL, UPDATE_MODEL, MODEL_PURCHASE, MY_MODELS, FEATURED_MODELS, MODELS, PURCHASES } from '../constant/routes.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsConfig = JSON.parse(readFileSync(path.join(__dirname, '../logs.json'), 'utf8'));

const router = express.Router();

// #READ: Get all models with optional filtering by search query and framework
// #SEARCH: MongoDB regex for case-insensitive search
// #FILTER: Framework filter and sorting capabilities
router.get(ALL_MODELS, optionalAuth, async (req, res, next) => {
    try {
        const db = getDB();
        const { search, framework, limit, sort } = req.query;
        let query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (framework && framework !== 'all') query.framework = framework;
        let modelsQuery = db.collection(MODELS).find(query);
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

// #DYNAMIC: Get featured models for home page - Returns 6 most recent models
router.get(FEATURED_MODELS, async (req, res, next) => {
    try {
        const db = getDB();
        const models = await db.collection(MODELS).find({}).sort({ createdAt: -1 }).limit(6).toArray();
        res.json({ success: true, count: models.length, data: models });
    } catch (error) {
        next(error);
    }
});

// #READ: Get models created by authenticated user - My Models page
// #AUTH: Requires valid Firebase JWT token
router.get(MY_MODELS, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        if (logsConfig.enableLogs.routes) {
            console.log('Fetching user models for:', req.user.email);
        }

        const models = await db.collection(MODELS).find({ createdBy: req.user.email }).sort({ createdAt: -1 }).toArray();
        // if (logsConfig.enableLogs.routes) {}
        res.json({ success: true, count: models.length, data: models });
    } catch (error) {
        if (logsConfig.enableLogs.routes) {
            console.log(error);
        }

        next(error);
    }
});

// #READ: Get detailed information about a specific model by ID
router.get(MODEL_DETAILS, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        console.info(ObjectId.isValid(id));
        const model = await db.collection(MODELS).findOne({ _id: new ObjectId(id) }); console.log(model);
        if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
        res.json({ success: true, data: model });
    } catch (error) {
        if (logsConfig.enableLogs.routes) {
            console.error('Error fetching model by ID:', error);
        }
        next(error);
    }
});

// #CREATE: Create new AI model with validation
// #AUTH: Requires authentication, auto-assigns createdBy from JWT
// #VALIDATION: Validates all required fields before insertion
router.post(ADD_MODEL, authMiddleware, async (req, res, next) => {
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
        const result = await db.collection(MODELS).insertOne(newModel);
        res.status(201).json({ success: true, message: 'Model added successfully', data: { _id: result.insertedId, ...newModel } });
    } catch (error) {
        next(error);
    }
});

// #UPDATE: Update existing model - Creator authorization enforced
// #AUTH: Verifies user is the creator before allowing updates
// #VALIDATION: Validates all fields and checks ownership
router.put(UPDATE_MODEL, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { name, framework, useCase, dataset, description, image } = req.body;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const existingModel = await db.collection(MODELS).findOne({ _id: new ObjectId(id) });
        if (!existingModel) return res.status(404).json({ success: false, message: 'Model not found' });
        if (existingModel.createdBy !== req.user.email) return res.status(403).json({ success: false, message: 'You are not authorized to update this model' });
        if (!name || !framework || !useCase || !dataset || !description || !image) {
            return res.status(400).json({ success: false, message: 'All fields are required: name, framework, useCase, dataset, description, image' });
        }
        const updateData = {
            name: name.trim(), framework: framework.trim(), useCase: useCase.trim(),
            dataset: dataset.trim(), description: description.trim(), image: image.trim(), updatedAt: new Date()
        };
        const result = await db.collection(MODELS).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.modifiedCount === 0) return res.status(400).json({ success: false, message: 'No changes made to the model' });
        const updatedModel = await db.collection(MODELS).findOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: 'Model updated successfully', data: updatedModel });
    } catch (error) {
        next(error);
    }
});

// #DELETE: Delete model and cascade delete all purchases
// #AUTH: Verifies user is the creator before allowing deletion
router.delete(DELETE_MODEL, authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const existingModel = await db.collection(MODELS).findOne({ _id: new ObjectId(id) });
        if (!existingModel) return res.status(404).json({ success: false, message: 'Model not found' });
        if (existingModel.createdBy !== req.user.email) return res.status(403).json({ success: false, message: 'You are not authorized to delete this model' });
        await db.collection(MODELS).deleteOne({ _id: new ObjectId(id) });
        await db.collection(PURCHASES).deleteMany({ modelId: id });
        res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// #PURCHASE: Purchase model - Increments counter and creates purchase record
// #REALTIME: Uses MongoDB $inc operator for atomic counter increment
// #AUTH: Requires authentication to purchase
router.post(MODEL_PURCHASE(':id'), authMiddleware, async (req, res, next) => {
    try {
        const db = getDB();
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid model ID format' });
        const model = await db.collection(MODELS).findOne({ _id: new ObjectId(id) });
        if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
        await db.collection(MODELS).updateOne({ _id: new ObjectId(id) }, { $inc: { purchased: 1 } }); // Increment purchased count
        const purchase = {
            modelId: id, modelName: model.name, 
            createdBy: model.createdBy, purchasedBy: req.user.email, purchasedAt: new Date()
        };
        await db.collection(PURCHASES).insertOne(purchase);
        const updatedModel = await db.collection(MODELS).findOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: 'Model purchased successfully', data: updatedModel });
    } catch (error) {
        next(error);
    }
});

export default router;
