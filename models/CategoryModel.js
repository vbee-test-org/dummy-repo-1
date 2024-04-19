import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    category: {
        type: String,
        unique: true,
        required: true
    },
    articles_guid: [{
        type: String,
    }]
}, { toJSON: { virtuals: true }});

CategorySchema.virtual("articles", {
    ref: 'Article',
    localField: "articles_guid",
    foreignField: "guid"  
});

const Category = mongoose.model("Category", CategorySchema)

export default Category