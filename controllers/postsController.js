import Post from "../models/posts/PostModel.js";
import PostCategory from "../models/posts/PostCategoryModel.js";
import { Redis } from "ioredis";

/***********************************Get posts****************************************/
const getPosts = async (req, res) => {
  // Get last modified date and check if the request has been modified
  const ifModifiedSince = req.get("If-Modified-Since");
  if (ifModifiedSince) {
    try {
      const { creation_date: lastModified } = await Post.findOne({}, { creation_date: 1, _id: 0 }, { sort: { creation_date: -1 } });
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
  const postsCache = await redis.get(`posts_content_${page}_${limit}`);
  // Cache hit
  if (postsCache) {
    console.log("Fetching posts from cache");
    redis.quit();
    return res.status(200).json(JSON.parse(postsCache));
  }
  // Cache miss
  try {
    console.log("Fetching posts from database");
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
      $project: {
        _id: 0,
        guid: 1,
        post_title: 1,
        post_link: 1,
        author: 1,
        website_source: 1,
        post_content: 1,
        creation_date: 1,
        up_votes: 1,
        down_votes: 1,
        categories: 1,
        media_url: 1
      }
    });
    const posts = await Post.aggregate(pipeline, { readConcern: { level: "majority" } });
    const count = await Post.estimatedDocumentCount();
    // Setting cache
    redis.set(`posts_content_${page}_${limit}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Full text search posts****************************************/
const fulltextSearchPosts = async (req, res) => {
  // Get params
  const text = req.params.text;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const searchCache = await redis.get(`posts_search_${text}_${page}_${limit}`);
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
        index: process.env.MONGODB_POST_SEARCH_INDEX_NAME,
        text: {
          query: text,
          path: ["post_title", "post_content"],
          fuzzy: {}
        },
      },
    });
    pipeline.push({
      $project: {
        _id: 0,
        guid: 1,
        post_title: 1,
        post_link: 1,
        author: 1,
        website_source: 1,
        post_content: 1,
        creation_date: 1,
        up_votes: 1,
        down_votes: 1,
        categories: 1,
        media_url: 1,
        score: { $meta: "searchScore" },
      }
    });
    pipeline.push({
      $facet: {
        metadata: [{ $count: "totalResults" }],
        posts: [{ $skip: (page - 1) * limit }, { $limit: limit }]
      }
    });
    const results = await Post.aggregate(pipeline);
    const posts = results[0].posts;
    const count = results[0].metadata[0].totalResults;
    redis.set(`posts_search_${text}_${page}_${limit}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts });
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
          guid: post.guid,
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
  const searchCache = await redis.get(`posts_${text}_${opt}_${page}_${limit}`);
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
      physicalPage = 1;
      results = await PostCategory.find({ category: searchTerm }).populate({
        path: "posts",
        options: {
          sort: { creation_date: -1 },
          perDocumentLimit: 10,
        }
      });
      count = results.length * 10;
    }
    else if (opt === "e") {
      searchTerm = { $eq: text };
      physicalPage = page;
      results = await PostCategory.find({ category: searchTerm }).populate({
        path: "posts",
        options: {
          sort: { creation_date: -1 },
          skip: (page - 1) * limit,
          limit: limit
        }
      });
      const postsCount = await PostCategory.aggregate([
        { $match: { category: searchTerm } },
        { $project: { _id: 0, count: { $size: "$posts_guid" } } }
      ]);
      count = postsCount[0].count;
    }
    else {
      return res.status(400).json({ error: "Undefined search term" })
    }
    const categories = results.map(category => ({
      category: category.category,
      posts: category.posts.map(post => ({
        guid: post.guid,
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
    }));

    redis.set(`posts_${text}_${opt}_${page}_${limit}`, JSON.stringify({ count, totalPages: opt === "r" ? 1 : Math.ceil(count / limit), currentPage: physicalPage, categories }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: opt === "r" ? 1 : Math.ceil(count / limit), currentPage: physicalPage, categories });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export { getPosts, fulltextSearchPosts, getPostCategories, searchPostCategories };
