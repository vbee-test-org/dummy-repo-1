import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  guid: {
    type: String,
    required: true,
  },
  post_link: {
    type: String,
    required: true
  },
  website_source: {
    type: String,
    required: true
  },
  type_: {
    type: String,
    required: true
  },
  post_title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  creation_date: {
    type: String,
    required: true
  },
  post_content: {
    type: String,
    required: true
  },
  upvotes: {
    type: Number,
    required: true
  },
  downvotes: {
    type: Number,
    required: true
  },
  categories: [{
    type: String,
    required: true
  }]
});

const Post = mongoose.model("Post", PostSchema, "posts");

export default Post;
