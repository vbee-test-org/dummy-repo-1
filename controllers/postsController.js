import Post from "../models/posts/PostModel.js";
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
  const postsCache = await redis.get(`posts_content_${page}`);
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
    const posts = await Post.aggregate(pipeline);
    const count = await Post.countDocuments();
    // Setting cache
    redis.set(`posts_content_${page}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/***********************************Full text search posts****************************************/
const fulltextSearchPosts = async (req, res) => {
  // Get params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const text = req.query.text;
  // Redis instance
  const redis = new Redis(process.env.REDIS_URL);
  const searchCache = await redis.get(`posts_search_${text}_${page}`);
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
          query: req.query.text,
          path: {
            wildcard: "*"
          },
          fuzzy: {}
        },
      },
    });
    pipeline.push({
      $project: {
        _id: 0,
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
    redis.set(`posts_search_${text}_${page}`, JSON.stringify({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts }), "EX", 600);
    redis.quit();
    res.status(200).json({ count, totalPages: Math.ceil(count / limit), currentPage: page, posts });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getPosts, fulltextSearchPosts };
