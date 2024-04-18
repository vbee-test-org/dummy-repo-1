import mongoose from "mongoose";
import Category from "../models/CategoryModel.js";

/***********************************Get categories****************************************/
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        const count = categories.length;
        res.status(200).json({ count, categories });
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}

/***********************************Search categories****************************************/
const searchCategories = async (req, res) => {
    const { name } = req.query.name;
    // If there is no specified name
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    try {
        const categories = await Category.find({ name: { $req: name, $options: "i" } });
        const count = categories.articles_guid.length || 0;
        res.status(200).json({success: `Found ${count} articles for category named ${name}`});
    } catch(error) {
        res.status(500).json({ error: error.message })
    }
}
export { getCategories, searchCategories } 
