import mongoose from "mongoose";

const PostCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  posts_guid: [{
    type: String,
  }],
  posts_count: {
    type: Number
  }
}, { toJSON: { virtuals: true } });

PostCategorySchema.virtual("posts", {
  ref: 'Post',
  localField: "posts_guid",
  foreignField: "guid"
});

PostCategorySchema.pre("save", (next) => {
  this.posts_count = this.posts_guid.length;
  next();
});

const PostCategory = mongoose.model("PostCategory", PostCategorySchema, "posts.categories")

export default PostCategory
