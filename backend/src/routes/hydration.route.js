import express from "express";
import { setupHydration, createDailyHydration } from "../services/hydration.js";
import { protect } from "../Middleware/protect.js";

const router = express.Router();
router.post("/setup", protect, setupHydration);
router.post("/daily", protect, createDailyHydration);
export default router;
