import express from 'express';
import { getArticleCategories, searchArticleCategories, getPostCategories, searchPostCategories } from '../controllers/categoriesController.js';

const router = express.Router();

// Get all articles categories route
router.get('/articles', getArticleCategories);

// Find a category for articles route
router.get('/articles/search', searchArticleCategories);

// Get all posts categories route
router.get('/posts', getPostCategories);

// Find a category for posts route
router.get('/posts/search', searchPostCategories);

export { router as categoriesRoutes };