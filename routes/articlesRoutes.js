import express from "express"
import Article from "../models/ArticleModel.js";
import { getArticles, addArticle, deleteArticle, updateArticle } from "../controllers/articlesController.js";

const router = express.Router()

// Get all articls route
router.get("/", getArticles);

// Add new article route
router.post("/", addArticle);

// Delete an article
router.delete("/:id", deleteArticle);

// Update an article
router.put("/:id", updateArticle);

export { router as articlesRoutes }