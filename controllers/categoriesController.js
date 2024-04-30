import ArticlePublisher from "../models/articles/ArticlePublisherModel.js";
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
    const categories = await ArticleCategory.find({ "articles_guid.10": { $exists: true } })
      .limit(5)
      .populate({
        path: "articles",
        options: {
          sort: { creation_date: -1 },
          perDocumentLimit: 10,
          populate: {
            path: "publisher",
          }
        }
      });
    const count = categories.length;
    const reduced_categories = {
      count,
      categories: categories.map(category => ({
        category: category.category,
        articles: category.articles.map(article => ({
          _id: article._id,
          guid: article.guid,
          article_link: article.article_link,
          type_: article.type_,
          website_source: article.website_source,
          article_title: article.article_title,
          author: article.author,
          creation_date: article.creation_date,
          thumbnail_image: article.thumbnail_image,
          article_summary: article.article_summary,
          article_detailed_content: article.article_detailed_content,
          categories: article.categories,
          publisher: article.publisher?.[0] || null
        }))
      }))
    }
    redis.set("article_categories_content", JSON.stringify(reduced_categories), "EX", 600);
    redis.quit();
    res.status(200).json(reduced_categories);
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
    const categories = await ArticleCategory.find({ category: { $regex: req.query.text } }).populate({
      path: "articles",
      options: {
        sort: { creation_date: -1 },
        populate: {
          path: "publisher"
        }
      }
    });
    const count = categories.length;
    const reduced_categories = {
      count,
      categories: categories.map(category => ({
        category: category.category,
        articles: category.articles.map(article => ({
          _id: article._id,
          guid: article.guid,
          article_link: article.article_link,
          type_: article.type_,
          website_source: article.website_source,
          article_title: article.article_title,
          author: article.author,
          creation_date: article.creation_date,
          thumbnail_image: article.thumbnail_image,
          article_summary: article.article_summary,
          article_detailed_content: article.article_detailed_content,
          categories: article.categories,
          publisher: article.publisher?.[0] || null
        }))
      }))
    }

    res.status(200).json(reduced_categories);
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
    const categories = await PostCategory.find({ "posts_guid.10": { $exists: true } })
      .limit(5)
      .populate({
        path: "posts",
        options: {
          sort: { creation_date: -1 },
          perDocumentLimit: 10,
        }
      });
    const count = categories.length;
    const reduced_categories = {
      count,
      categories: categories.map(category => ({
        category: category.category,
        posts: category.posts.map(post => ({
          _id: post._id,
          guid: post.guid,
          post_link: post.post_link,
          type_: post.type_,
          website_source: post.website_source,
          post_title: post.post_title,
          author: post.author,
          creation_date: post.creation_date,
          post_content: post.post_content,
          categories: post.categories,
          up_votes: post.up_votes,
          down_votes: post.down_votes
        }))
      }))
    }

    redis.set("post_categories_content", JSON.stringify(reduced_categories), "EX", 600);
    redis.quit();
    res.status(200).json(reduced_categories);
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
    const categories = await PostCategory.find({ category: { $regex: req.query.text } }).populate({
      path: "posts",
      options: {
        sort: { creation_date: -1 }
      }
    });
    const count = categories.length;
    const reduced_categories = {
      count,
      categories: categories.map(category => ({
        category: category.category,
        posts: category.posts.map(post => ({
          _id: post._id,
          guid: post.guid,
          post_link: post.post_link,
          type_: post.type_,
          website_source: post.website_source,
          post_title: post.post_title,
          author: post.author,
          creation_date: post.creation_date,
          post_content: post.post_content,
          categories: post.categories,
          up_votes: post.up_votes,
          down_votes: post.down_votes
        }))
      }))
    }

    res.status(200).json(reduced_categories);
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getArticleCategories, searchArticleCategories, getPostCategories, searchPostCategories } 
