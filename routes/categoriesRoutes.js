import express from 'express';
import { getCategories, searchCategories } from '../controllers/categoriesController.js';

const router = express.Router();

// Get all categories route
router.get('/', getCategories);

// Find a category route
router.get('/search', searchCategories);

export { router as categoriesRoutes };