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
    const categories = await ArticleCategory.find()
      .sort({ articles_count: -1 })
      .limit(10)
      .populate({
        path: "articles",
        options: {
          sort: { creation_date: -1 },
          perDocumentLimit: 30,
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
          article_link: article.article_link,
          article_title: article.article_title,
          author: article.author,
          creation_date: article.creation_date,
          thumbnail_image: article.thumbnail_image,
          article_summary: article.article_summary,
          article_detailed_content: article.article_detailed_content,
          categories: article.categories,
          publisher: {
            name: article.publisher?.[0]?.name || "",
            logo: article.publisher?.[0]?.logo || ""
          }
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
  // Get params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const text = req.query.text;
  const opt = req.query.opt || "e";

  if (!text) {
    return res.status(400).json({ error: "text must not be empty!" })
  }

  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const searchCache = await redis.get(`articles_${text}_${opt}_${page}`);
  // Cache hit
  if (searchCache) {
    console.log("Fetching results from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(searchCache));
  }
  // Cache miss
  try {
    var results;
    if (opt === "r") {
      results = await ArticleCategory.find({ category: { $regex: `^${text}` } })
        .populate({
          path: "articles",
          options: {
            sort: { creation_date: -1 },
            perDocumentLimit: 30,
            populate: {
              path: "publisher"
            }
          }
        });
    }
    else if (opt === "e") {
      results = await ArticleCategory.find({ category: { $eq: text } })
        .populate({
          path: "articles",
          options: {
            sort: { creation_date: -1 },
            populate: {
              path: "publisher"
            },
            skip: (page - 1) * limit,
            limit: limit
          }
        });
    }
    else {
      return res.status(400).json({ error: "Undefined search term" })
    }
    const count = results.reduce((acc, current) => {
      acc + current.articles_count
    }, 0);
    const categories = {
      categories: results.map(category => ({
        category: category.category,
        articles: category.articles.map(article => ({
          article_link: article.article_link,
          article_title: article.article_title,
          author: article.author,
          creation_date: article.creation_date,
          thumbnail_image: article.thumbnail_image,
          article_summary: article.article_summary,
          article_detailed_content: article.article_detailed_content,
          categories: article.categories,
          publisher: {
            name: article.publisher?.[0]?.name || "",
            logo: article.publisher?.[0]?.logo || ""
          }
        }))
      }))
    }

    redis.set(`articles_${text}_${opt}_${page}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, categories }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, categories });
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
    const categories = await PostCategory.find()
      .sort({ posts_count: -1 })
      .limit(10)
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
          post_link: post.post_link,
          website_source: post.website_source,
          post_title: post.post_title,
          author: post.author,
          creation_date: post.creation_date,
          post_content: post.post_content,
          categories: post.categories,
          up_votes: post.up_votes,
          down_votes: post.down_votes,
          media_url: post.media_url
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
  const opt = req.query.opt || "e";

  if (!text) {
    return res.status(400).json({ error: "text must not be empty!" })
  }

  var searchTerm;
  if (opt === "r") {
    searchTerm = { $regex: `^${text}` };
  }
  else if (opt === "e") {
    searchTerm = { $eq: text };
  }
  else {
    return res.status(400).json({ error: "Undefined search term" })
  }

  try {
    const categories = await PostCategory.find({ category: searchTerm }).populate({
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
          post_link: post.post_link,
          website_source: post.website_source,
          post_title: post.post_title,
          author: post.author,
          creation_date: post.creation_date,
          post_content: post.post_content,
          categories: post.categories,
          up_votes: post.up_votes,
          down_votes: post.down_votes,
          media_url: post.media_url
        }))
      }))
    }

    res.status(200).json(reduced_categories);
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getArticleCategories, searchArticleCategories, getPostCategories, searchPostCategories } 
