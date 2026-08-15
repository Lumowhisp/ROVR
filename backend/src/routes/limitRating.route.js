import express from "express";
import { saveLimitRating } from "../services/limitRating.js";
import { protect } from "../Middleware/protect.js";

const router = express.Router();
router.post("/limit-rating", protect, saveLimitRating);
export default router;
