import Post from "../models/posts/PostModel.js";
import { Redis } from "ioredis";

/***********************************Get posts****************************************/
const getPosts = async (req, res) => {
    // Redis instance
    const redis = new Redis(process.env.REDIS_URL);
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
    const { page, limit } = req.body;
    const articlesCache = await redis.get(`posts_content_${page}`);
    // Cache hit
    if (articlesCache) {
      console.log("Fetching posts from cache");
      return res.status(200).json(JSON.parse(articlesCache));
    }
    // Cache miss
    try {
      console.log("Fetching posts from database");
      const posts = await Post.find()
                        .skip((page -1) * limit)
                        .limit(limit)
                        .sort({ creation_date: -1 });
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
  try {
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
    })

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
        upvotes: 1,
        downvotes: 1,
        categories: 1,
        score: { $meta: "searchScore" },
      }
    })

    const result = await Post.aggregate(pipeline).sort({ creation_date: req.query.sort === "desc" ? -1 : 1 });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

  export { getPosts, fulltextSearchPosts };