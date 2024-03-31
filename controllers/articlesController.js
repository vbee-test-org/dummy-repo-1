import mongoose from "mongoose";
import Article from "../models/ArticleModel.js";

/***********************************Get articles*************************************** */
const getArticles = async (req, res) => {
    try {
        const articles = await Article.find();
        const count = articles.length;
        res.status(200).json({ count, articles });
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}

/***********************************Create an article*************************************** */
const addArticle = async (req, res) => {
    
    // Grab the data from request body
    const { guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image } = req.body;
    
    // Check the fields are not empty
    if (!guid || !article_title || !article_summary) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    try {
        const article = await Article.create({ guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image })

        res.status(200).json({msg: "Article created", article});
    } catch(error) {
        res.status(500).json({error: error.message});
    }
}

/***********************************Delete an article*************************************** */
const deleteArticle = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Incorrect id" });
    }
    const article = await Article.findById(req.params.id)
    if (!article) {
        return res.status(400).json({ error: "Article not found" });
    }
    try {
        await article.deleteOne();
        res.status(200).json({ success: "Article was deleted" })
    } catch(error) {
        return res.status(500).json({})
    }

}

/***********************************Update an article*************************************** */
const updateArticle = async (req, res) => {
    // Request body
    const { guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image } = req.body;
    if (!guid || !article_title || !article_summary || !creation_date) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    // Check for valid ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Incorrect id" });
    }

    // Check if article exists
    const article = await Article.findById(req.params.id)
    if (!article) {
        return res.status(400).json({ error: "Article not found" });
    }

    try {
        await article.updateOne({ guid, article_link, website_source, article_title, author, article_type, article_summary, article_detailed_content, creation_date, thumbnail_image });
        res.status(200).json({ success: "Post was updated" })
    } catch(error) {
        res.status(500).json({ error: error.message});
    }

}

export { getArticles ,addArticle, deleteArticle, updateArticle }  