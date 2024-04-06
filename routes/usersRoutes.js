import express from "express"
import { registerUser, loginUser } from "../controllers/usersController.js";

const router = express.Router()

// Create new user
router.get("/signup", registerUser);

// Login
router.post("/login", loginUser);

export { router as usersRoutes }