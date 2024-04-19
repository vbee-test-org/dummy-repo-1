import mongoose from "mongoose";
import Category from "../models/CategoryModel.js";

/***********************************Get categories****************************************/
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("articles");
        const count = categories.length();
        res.status(200).json({ count, categories });
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}

/***********************************Search categories****************************************/
const searchCategories = async (req, res) => {
    // If there is no specified name
    const { text } = req.query.text;
    if (!text) {
        return res.status(400).json({ error: "Category name is required" });
    }

    try {
        const categories = await Category.find({ name: { $req: text, $options: "i" } });
        const count = categories.articles_guid.length || 0;
        res.status(200).json({success: `Found ${count} articles for category named ${text}`});
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}
export { getCategories, searchCategories } 
