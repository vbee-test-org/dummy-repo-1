import mongoose from "mongoose";
import Article from "../models/articles/ArticleModel.js";
import ArticleCategory from "../models/articles/ArticleCategoryModel.js";
import { Redis } from "ioredis";

/***********************************Get articles****************************************/
const getArticles = async (req, res) => {
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
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  // Get params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const articlesCache = await redis.get(`articles_content_${page}_${limit}`);
  // Cache hit
  if (articlesCache) {
    console.log("Fetching articles from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(articlesCache));
  }
  // Cache miss
  try {
    console.log("Fetching articles from database");
    // Pipeline
    const pipeline = [];
    pipeline.push({
      $match: {}
    });
    pipeline.push({
      $sort: { creation_date: -1 }
    });
    if (page !== null) {
      pipeline.push({
        $skip: (page - 1) * limit
      });
      pipeline.push({
        $limit: limit
      });
    }
    pipeline.push({
      $lookup: {
        from: "articles.publishers",
        localField: "website_source",
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
        article_title: 1,
        article_link: 1,
        author: 1,
        publisher: {
          name: "$publisher.name",
          logo: "$publisher.logo"
        },
        article_summary: 1,
        article_detailed_content: 1,
        thumbnail_image: 1,
        creation_date: 1,
        categories: 1,
      }
    });
    const articles = await Article.aggregate(pipeline, { readConcern: { level: "majority" } });
    const count = await Article.estimatedDocumentCount();
    // Setting cache
    redis.set(`articles_content_${page}_${limit}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Search a specific article****************************************/
const fulltextSearchArticles = async (req, res) => {
  // Get params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const text = req.query.text;
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const searchCache = await redis.get(`articles_search_${text}_${page}_${limit}`);
  // Cache hit
  if (searchCache) {
    console.log("Fetching results from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(searchCache));
  }
  // Cache miss
  try {
    console.log("Fetching results from database");
    // Pipeline
    const pipeline = []
    pipeline.push({
      $search: {
        index: process.env.MONGODB_ARTICLE_SEARCH_INDEX_NAME,
        text: {
          query: text,
          path: ["article_title", "article_summary"],
          fuzzy: {}
        },
      },
    });
    pipeline.push({
      $lookup: {
        from: "articles.publishers",
        localField: "website_source",
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
        article_title: 1,
        article_link: 1,
        author: 1,
        publisher: {
          name: "$publisher.name",
          logo: "$publisher.logo"
        },
        article_summary: 1,
        article_detailed_content: 1,
        thumbnail_image: 1,
        creation_date: 1,
        categories: 1,
        score: { $meta: "searchScore" },
      }
    });
    pipeline.push({
      $facet: {
        metadata: [{ $count: "totalResults" }],
        articles: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    })
    const results = await Article.aggregate(pipeline);
    const articles = results[0].articles;
    const count = results[0].metadata[0].totalResults;
    redis.set(`articles_search_${text}_${page}_${limit}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, articles });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      $lookup: {
        from: "articles.publishers",
        localField: "website_source",
        foreignField: "ref_name",
        as: "publisher",
      }
    })
    pipeline.push({
      $unwind: "$publisher"
    })
    pipeline.push({
      $project: {
        _id: 0,
        article_title: 1,
        article_link: 1,
        author: 1,
        website_source: 0,
        publisher: {
          name: "$publisher.name",
          logo: "$publisher.logo"
        },
        article_summary: 1,
        article_detailed_content: 1,
        thumbnail_image: 1,
        creation_date: 1,
        categories: 1,
        score: { $meta: "searchScore" },
      }
    })
    const result = await Article.aggregate(pipeline)
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

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
  const text = req.params.text;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const opt = req.query.opt || "e";

  if (!text) {
    return res.status(400).json({ error: "Search term must not be empty!" })
  }
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const searchCache = await redis.get(`articles_${text}_${opt}_${page}_${limit}`);
  // Cache hit
  if (searchCache) {
    console.log("Fetching results from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(searchCache));
  }
  // Cache miss
  try {
    var searchTerm, physicalPage, results, count;
    if (opt === "r") {
      searchTerm = { $regex: `^${text}` }
      physicalPage = null;
      results = await ArticleCategory.find({ category: searchTerm })
        .populate({
          path: "articles",
          options: {
            sort: { creation_date: -1 },
            perDocumentLimit: 10,
            populate: {
              path: "publisher"
            }
          }
        });
      count = results.length * 10;
    }
    else if (opt === "e") {
      searchTerm = { $eq: text };
      physicalPage = page;
      results = await ArticleCategory.find({ category: searchTerm })
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
      const articlesCount = await ArticleCategory.aggregate([
        { $match: { category: searchTerm } },
        { $project: { _id: 0, count: { $size: "$articles_guid" } } }
      ]);
      count = articlesCount[0].count;
    }
    else {
      return res.status(400).json({ error: "Undefined search term" })
    }
    const categories = results.map(category => ({
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
    }));

    redis.set(`articles_${text}_${opt}_${physicalPage}_${limit}`, JSON.stringify({ count, totalPages: opt === "r" ? 1 : Math.ceil(count / limit), currentPage: physicalPage, categories }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: opt === "r" ? 1 : Math.ceil(count / limit), currentPage: page, categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getArticles, fulltextSearchArticles, autocompleteArticleSearch, getArticleCategories, searchArticleCategories }  
