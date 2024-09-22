import express from "express"
import { getCoins, getCoinsById } from "../controllers/coinsController.js"
const router = express.Router()

// Get all coins
router.get("/", getCoins)

// Get a specific coin 
router.get("/:symbol", getCoinsById)

export { router as coinsRoutes }
