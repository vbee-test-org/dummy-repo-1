import express from "express";
import { getPosts, fulltextSearchPosts } from "../controllers/postsController.js";

const router = express.Router();

// Get all posts
router.get("/", getPosts);

// Full text search posts
router.get("/search", fulltextSearchPosts);

export { router as postsRoutes }


