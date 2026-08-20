import express from "express";
import { setupHydration, createDailyHydration, getTodayHydration, logWater, getWeeklyHydration } from "../services/hydration.js";
import { protect } from "../Middleware/protect.js";

const router = express.Router();
router.post("/setup", protect, setupHydration);
router.post("/daily", protect, createDailyHydration);
router.get("/today", protect, getTodayHydration);
router.patch("/log", protect, logWater);
router.get("/weekly", protect, getWeeklyHydration);
export default router;
