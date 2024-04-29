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
    // Pipeline
    const pipeline = [];
    pipeline.push({ $addFields: { categoryPopulation: { $size: "$articles_guid" } } })
    pipeline.push({ $sort: { categoryPopulation: -1 } });
    pipeline.push({ $limit: 10 });
    pipeline.push({ $unwind: "$articles_guid" });
    pipeline.push({
      $lookup: {
        from: "articles",
        localField: "articles_guid",
        foreignField: "guid",
        as: "articles",
        pipeline: [
          { $sort: { creation_date: -1 } },
          { $limit: 5 },
          { $lookup: { from: "articles.publishers", localField: "website_source", foreignField: "ref_name", as: "publisher" } },
          { $unwind: "$publisher" }
        ]
      }
    });
    pipeline.push({
      $group: {
        _id: "$category",
        articles: { $push: "$articles" }
      }
    });
    pipeline.push({
      $project: {
        _id: 0,
        category: "$_id",
        articles: {
          $map: {
            input: "$articles",
            as: "article",
            in: {
              guid: { $arrayElemAt: ["$$article.guid", 0] },
              article_link: { $arrayElemAt: ["$$article.article_link", 0] },
              publisher: { $arrayElemAt: ["$$article.publisher", 0] },
              article_title: { $arrayElemAt: ["$$article.article_title", 0] },
              type_: { $arrayElemAt: ["$$article.type_", 0] },
              author: { $arrayElemAt: ["$$article.author", 0] },
              article_summary: { $arrayElemAt: ["$$article.article_summary", 0] },
              article_detailed_content: { $arrayElemAt: ["$$article.article_detailed_content", 0] },
              creation_date: { $arrayElemAt: ["$$article.creation_date", 0] },
              thumbnail_image: { $arrayElemAt: ["$$article.thumbnail_image", 0] },
              categories: { $arrayElemAt: ["$$article.categories", 0] },
            }
          }
        }
      }
    });
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
    // Pipeline
    const pipeline = [];
    pipeline.push({ $addFields: { categoryPopulation: { $size: "$posts_guid" } } })
    pipeline.push({ $sort: { categoryPopulation: -1 } });
    pipeline.push({ $limit: 10 });
    pipeline.push({ $unwind: "$posts_guid" });
    pipeline.push({
      $lookup: {
        from: "posts",
        localField: "posts_guid",
        foreignField: "guid",
        as: "posts",
        pipeline: [
          { $sort: { creation_date: -1 } },
          { $limit: 5 }
        ]
      }
    });
    pipeline.push({
      $group: {
        _id: "$category",
        posts: { $push: "$posts" }
      }
    });
    pipeline.push({
      $project: {
        _id: 0,
        category: "$_id",
        posts: {
          $map: {
            input: "$posts",
            as: "post",
            in: {
              guid: { $arrayElemAt: ["$$post.guid", 0] },
              post_link: { $arrayElemAt: ["$$post.post_link", 0] },
              post_title: { $arrayElemAt: ["$$post.post_title", 0] },
              type_: { $arrayElemAt: ["$$post.type_", 0] },
              website_source: { $arrayElemAt: ["$$post.website_source", 0] },
              author: { $arrayElemAt: ["$$post.author", 0] },
              creation_date: { $arrayElemAt: ["$$post.creation_date", 0] },
              post_content: { $arrayElemAt: ["$$post.post_content", 0] },
              upvotes: { $arrayElemAt: ["$$post.upvotes", 0] },
              downvotes: { $arrayElemAt: ["$$post.downvotes", 0] },
              categories: { $arrayElemAt: ["$$post.categories", 0] }
            }
          }
        }
      }
    });
    const categories = await PostCategory.aggregate(pipeline);
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
