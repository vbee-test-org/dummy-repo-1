import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
        unique: true
    },
    article_link: {
        type: String,
        required: true
    },
    website_source: {
        type: String,
        required: true
    },
    article_title: {
        type: String,
        required: true
    },
    type_: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    article_summary: {
        type: String,
        required: true
    },
    article_detailed_content: {
        type: String,
        required: true
    },
    creation_date: {
        type: String,
        required: true
    },
    thumbnail_image: {
        type: String,
        required: true
    },
    categories: [{
        type: String,
        required: true
    }]
})

const Article = mongoose.model("Article", ArticleSchema, "articles")

export default Article