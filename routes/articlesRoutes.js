import express from "express"
import { getArticles, addArticle, deleteArticle, updateArticle, fulltextSearchArticles, autocompleteArticleSearch } from "../controllers/articlesController.js"

const router = express.Router()

// Get all articls route
router.get("/", getArticles);

// Add new article route
router.post("/", addArticle);

// Delete an article
router.delete("/:id", deleteArticle);

// Update an article
router.put("/:id", updateArticle);

// Search for articles
router.get("/search", fulltextSearchArticles);

// Autocomplete search
router.get("/autocomplete", autocompleteArticleSearch);

export { router as articlesRoutes }
