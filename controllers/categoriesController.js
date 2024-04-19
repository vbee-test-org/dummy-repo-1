import mongoose from "mongoose";
import Category from "../models/CategoryModel.js";

/***********************************Get categories****************************************/
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate("articles");
        const count = categories.length;
        res.status(200).json({ count, categories });
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}

/***********************************Search categories****************************************/
const searchCategories = async (req, res) => {

    try {
        const categories = await Category.findOne({ name: { $regex: req.query.text, $options: "i" } });
        const count = categories.articles_guid.length || 0;
        res.status(200).json({success: `Found ${count} articles for category named ${req.query.text}`});
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}
export { getCategories, searchCategories } 
