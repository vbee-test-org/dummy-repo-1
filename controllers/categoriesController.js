import { createConnection } from "mongoose";
import ArticleCategory from "../models/articles/ArticleCategoryModel.js";
import PostCategory from "../models/posts/PostCategoryModel.js";
import { Redis } from "ioredis";

/***********************************Get article categories****************************************/
const getArticleCategories = async (req, res) => {
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const categoriesCache = await redis.get("article_categories_content");
  // Cache hit
  if (categoriesCache) {
    console.log("Fetching categories for articles from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(categoriesCache));
  }
  // Cache miss
  try {
    console.log("Fetching categories for articles from database");
    const categories = await ArticleCategory.find({ category: { $in: ["cryptocurrency", "press release", "ethereum", "news", "bitcoin"] } }).populate({
      path: "articles",
      options: {
        sort: { creation_date: -1 },
        perDocumentLimit: 5
      }
    });
    const count = categories.length;
    redis.set("article_categories_content", JSON.stringify({ count, categories }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Search article categories****************************************/
const searchArticleCategories = async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: "text must not be empty!" })
  }
  try {
    const categories = await ArticleCategory.find({ category: { $regex: req.query.text } }).populate("articles");
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Get post categories****************************************/
const getPostCategories = async (req, res) => {
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const categoriesCache = await redis.get("post_categories_content");
  // Cache hit
  if (categoriesCache) {
    console.log("Fetching categories for posts from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(categoriesCache));
  }
  // Cache miss
  try {
    console.log("Fetching categories for posts from database");
    const categories = await PostCategory.find({ category: { $in: ["discussion", "advice", "analysis", "general", "comedy"] } }).populate({
      path: "posts",
      options: {
        sort: { creation_date: -1 },
        perDocumentLimit: 5
      }
    });
    const count = categories.length;
    redis.set("post_categories_content", JSON.stringify({ count, categories }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Search post categories****************************************/
const searchPostCategories = async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: "text must not be empty!" })
  }
  try {
    const categories = await PostCategory.find({ category: { $regex: req.query.text } }).populate("posts");
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getArticleCategories, searchArticleCategories, getPostCategories, searchPostCategories } 
