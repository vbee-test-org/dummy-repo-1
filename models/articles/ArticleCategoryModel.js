import mongoose from "mongoose";

const ArticleCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    unique: true,
    required: true
  },
  articles_guid: [{
    type: String,
  }]
}, { toJSON: { virtuals: true } });

ArticleCategorySchema.virtual("articles", {
  ref: 'Article',
  localField: "articles_guid",
  foreignField: "guid",
});

const ArticleCategory = mongoose.model("ArticleCategory", ArticleCategorySchema, "articles.categories")

export default ArticleCategory
