import mongoose from "mongoose";

const ArticleCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    unique: true,
    required: true
  },
  articles_guid: [{
    type: String,
  }],
  articles_count: {
    type: Number
  }
}, { toJSON: { virtuals: true } });

ArticleCategorySchema.virtual("articles", {
  ref: 'Article',
  localField: "articles_guid",
  foreignField: "guid",
});

ArticleCategorySchema.pre("save", (next) => {
  this.articles_count = this.articles_guid.length;
  next();
});

const ArticleCategory = mongoose.model("ArticleCategory", ArticleCategorySchema, "articles.categories")

export default ArticleCategory
