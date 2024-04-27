import mongoose from "mongoose";
import Article from "../models/articles/ArticleModel.js";
import { Redis } from "ioredis";

/***********************************Get articles****************************************/
const getArticles = async (req, res) => {
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  // Get last modified date and check if the request has been modified
  const ifModifiedSince = req.get("If-Modified-Since");
  if (ifModifiedSince) {
    try {
      const { creation_date: lastModified } = await Article.findOne({}, { creation_date: 1, _id: 0 }, { sort: { creation_date: -1 } });
      if (lastModified && new Date(ifModifiedSince) >= new Date(lastModified)) {
        return res.status(304).send();
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const articlesCache = await redis.get(`articles_content_${page.toString()}`);
  // Cache hit
  if (articlesCache) {
    console.log("Fetching articles from cache");
    return res.status(200).json(JSON.parse(articlesCache));
  }
  // Cache miss
  try {
    console.log("Fetching articles from database");
    const articles = await Article.find()
                      .skip((page -1) * limit)
                      .limit(limit)
                      .sort({ creation_date: -1 });
    const count = await Article.countDocuments();
    // Setting cache
    redis.set(`articles_content_${page}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Create an article****************************************/
const addArticle = async (req, res) => {

  // Grab the data from request body
  const { guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image, categories } = req.body;

  // Check the fields are not empty
  if (!guid || !article_title || !article_summary || !creation_date || !article_link || !website_source || !author || !article_type || !article_detailed_content || !thumbnail_image || !categories) {
    return res.status(400).json({ error: "All fields are required!!!" })
  }

  try {
    const article = await Article.create({ guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image, categories });
    res.status(200).json({ msg: "Article created", article });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/***********************************Delete an article****************************************/
const deleteArticle = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Incorrect id" });
  }
  const article = await Article.findById(req.params.id)
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }
  try {
    await article.deleteOne();
    res.status(200).json({ success: "Article was deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }

}

/***********************************Update an article****************************************/
const updateArticle = async (req, res) => {
  // Request body
  const { guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image, categories } = req.body;
  if (!guid || !article_title || !article_summary || !creation_date || !article_link || !website_source || !author || !article_type || !article_detailed_content || !thumbnail_image || !categories) {
    return res.status(400).json({ error: "All fields are required!!!" })
  }

  // Check for valid ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Incorrect id" });
  }

  // Check if article exists
  const article = await Article.findById(req.params.id)
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  try {
    await article.updateOne({ guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image });
    res.status(200).json({ success: "Article was updated" })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}

/***********************************Search a specific article****************************************/
const fulltextSearchArticles = async (req, res) => {
  try {
    const pipeline = []
    pipeline.push({
      $search: {
        index: process.env.MONGODB_ARTICLE_SEARCH_INDEX_NAME,
        text: {
          query: req.query.text,
          path: {
            wildcard: "*"
          },
          fuzzy: {}
        },
      },
    })

    pipeline.push({
      $project: {
        _id: 0,
        guid: 1,
        article_title: 1,
        article_link: 1,
        author: 1,
        website_source: 1,
        article_summary: 1,
        article_detailed_content: 1,
        thumbnail_image: 1,
        creation_date: 1,
        categories: 1,
        score: { $meta: "searchScore" },
      }
    })

    const result = await Article.aggregate(pipeline).sort({ creation_date: req.query.sort === "desc" ? -1 : 1 });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Autocomplete search****************************************/
const autocompleteArticleSearch = async (req, res) => {
  try {
    const pipeline = []
    pipeline.push({
      $search: {
        index: process.env.MONGODB_SEARCH_INDEX_NAME,
        autocomplete: {
          query: req.query.text,
          path: "article_title",
          tokenOrder: "sequential",
        },
      },
    })

    pipeline.push({
      $project: {
        _id: 0,
        guid: 1,
        article_title: 1,
        article_link: 1,
        author: 1,
        website_source: 1,
        article_summary: 1,
        article_detailed_content: 1,
        thumbnail_image: 1,
        creation_date: 1,
        score: { $meta: "searchScore" },
      }
    })

    const result = await Article.aggregate(pipeline)
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
//TODO: Add get request for specific news source

export { getArticles, addArticle, deleteArticle, updateArticle, fulltextSearchArticles, autocompleteArticleSearch }  
