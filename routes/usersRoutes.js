import express from "express"
import { registerUser, loginUser, updateUser } from "../controllers/usersController.js";

const router = express.Router()

// Create new user
router.post("/signup", registerUser);

// Login
router.post("/login", loginUser);

// Update user
router.put("/update", updateUser);

export { router as usersRoutes }