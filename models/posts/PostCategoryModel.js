import mongoose from "mongoose";

const PostCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  posts_guid: [{
    type: String,
  }]
}, { toJSON: { virtuals: true } });

PostCategorySchema.virtual("posts", {
  ref: 'Post',
  localField: "posts_guid",
  foreignField: "guid"
});

const PostCategory = mongoose.model("PostCategory", PostCategorySchema, "posts.categories")

export default PostCategory
