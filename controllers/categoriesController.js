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
    const text = req.query.text;
    if (!text) {
        return res.status(400).json({ error: "text must not be empty!"})
    }
    try {
        const categories = await Category.findOne({ category: { $regex: req.query.text } }).populate("articles");
        const count = categories.length;
        res.status(200).json({ count, categories });
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}
export { getCategories, searchCategories } 