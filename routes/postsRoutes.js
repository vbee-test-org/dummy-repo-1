import express from "express";
import { getPosts, fulltextSearchPosts, getPostCategories, searchPostCategories } from "../controllers/postsController.js";

const router = express.Router();

// Get all posts
router.get("/", getPosts);

// Full text search posts
router.get("/search", fulltextSearchPosts);

// Get all posts categories
router.get("/categories", getPostCategories);

// Search posts categories
router.get("/categories/:text", searchPostCategories);

export { router as postsRoutes }


