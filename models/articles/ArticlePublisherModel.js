import mongoose from "mongoose";

const ArticlePublisherSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  ref_name: {
    type: String,
    required: true
  }
});

const ArticlePublisher = mongoose.model("ArticlePublisher", ArticlePublisherSchema, "articles.publishers");

export default ArticlePublisher;
