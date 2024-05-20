import express from "express"
import { getArticles, fulltextSearchArticles, autocompleteArticleSearch, getArticleCategories, searchArticleCategories } from "../controllers/articlesController.js"

const router = express.Router()

// Get all articles route
router.get("/", getArticles);

// Search for articles
router.get("/:text", fulltextSearchArticles);

// Autocomplete search
router.get("/autocomplete/:text", autocompleteArticleSearch);

// Get all for articles categories
router.get("/categories", getArticleCategories);

// Search for articles categories
router.get("/categories/:text", searchArticleCategories);

export { router as articlesRoutes }
