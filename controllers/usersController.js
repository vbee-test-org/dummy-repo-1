import User from "../models/UserModel.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/***********************************Register User****************************************/
const registerUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    const exist = await User.findOne({ email});
    if (exist) {
        return res.status(400).json({ error: "User already exists!!!"})
    }
    // Hash password
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({ email, password: hashed });
        res.status(200).json({ email });
    } catch(error) {
        res.status(500).json({ error: error.message});
    }
}

/***********************************Login User****************************************/
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required!!!"})
    }

    const user = await User.findOne({ email});
    if (!user) {
        return res.status(400).json({ error: "Incorrect email"})
    }
    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ error: "Incorrect password"})
    }

    try {
        res.status(200).json({ email });
    } catch(error) {
        res.status(500).json({ error: error.message});
    }
}

export { registerUser, loginUser } 

