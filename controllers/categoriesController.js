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
    return res.status(200).json(JSON.parse(categoriesCache));
  }
  // Cache miss
  try {
    console.log("Fetching categories for articles from database");
    const pipeline = [];

    pipeline.push({
      $match: {}
    });

    pipeline.push({
      $addFields: { categorySize:  { $size: "$articles_guid" }}
    })

    pipeline.push({
      $sort: { categorySize: -1}
    });

    pipeline.push({
      $limit: 20
    });

    pipeline.push({
      $lookup: {
        from: "articles",
        localField: "articles_guid",
        foreignField: "guid",
        as: "articles"
      }
    });

    pipeline.push({
      $lookup: {
        from: "articles.publishers",
        localField: "articles.website_source",
        foreignField: "ref_name",
        as: "publisher",
      }
    });

    pipeline.push({
      $unwind: "$publisher"
    });


    pipeline.push({
      $project: {
        _id: 0,
        category: 1,
        articles: {
          guid: 1,
          type: 1,
          article_title: 1,
          article_link: 1,
          article_summary: 1,
          article_detailed_content: 1,
          creation_date: 1,
          thumbnail_image: 1,
          categories: 1
        }
      }
    })

    const categories = await ArticleCategory.aggregate(pipeline);
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
    res.status(200).json({ categories});
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
    return res.status(200).json(JSON.parse(categoriesCache));
  }
  // Cache miss
  try {
    console.log("Fetching categories for posts from database");


    const categories = await PostCategory.find().populate("posts");
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
