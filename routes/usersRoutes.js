import express from "express"
import { registerUser, loginUser, updateUserPassword, updateUserSubscription } from "../controllers/usersController.js";

const router = express.Router()

// Create new user
router.post("/signup", registerUser);

// Login
router.post("/login", loginUser);

// Update user password
router.put("/updatepw", updateUserPassword);

// Update user subscription
router.put("/subscription", updateUserSubscription);

export { router as usersRoutes }