import express from "express";
import { protect } from "../Middleware/protect.js";
import { syncSteps, getToday, getHistory } from "../services/steps/step.service.js";
import { getGoal, updateGoal } from "../services/steps/goal.service.js";
import {
  getWeeklyStats,
  getMonthlyStats,
  getOverallStats,
  getStreaks,
} from "../services/steps/analytics.service.js";

const router = express.Router();

/**
 * POST /sync
 * Sync step data from the mobile/device layer.
 *
 * Body: { date: "YYYY-MM-DD", steps: number, active_minutes?: number }
 */
router.post("/sync", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const activity = await syncSteps(userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Steps synced successfully",
      data: activity,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("required") ||
          error.message.includes("cannot") ||
          error.message.includes("must") ||
          error.message.includes("Invalid") ||
          error.message.includes("exceeds")
        ? 400
        : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /today
 * Get today's activity and goal progress.
 */
router.get("/today", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getToday(userId, req.query.date);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get daily activity history with optional date filtering.
 */
router.get("/history", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;
    const data = await getHistory(userId, start_date, end_date);
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("Invalid") ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /weekly
 * Get last 7 days analytics.
 */
router.get("/weekly", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getWeeklyStats(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /monthly
 * Get last 30 days analytics.
 */
router.get("/monthly", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getMonthlyStats(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /stats
 * Get all-time personal bests and overall statistics.
 */
router.get("/stats", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getOverallStats(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /streak
 * Get current and longest streak.
 */
router.get("/streak", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getStreaks(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /goal
 * Get the user's current daily step goal.
 */
router.get("/goal", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getGoal(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * PUT /goal
 * Update the user's daily step goal.
 *
 * Body: { goal: number }
 */
router.put("/goal", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal } = req.body;
    const data = await updateGoal(userId, goal);
    return res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data,
    });
  } catch (error) {
    const statusCode =
      error.message.includes("not found")
        ? 404
        : error.message.includes("must") || error.message.includes("exceeds")
          ? 400
          : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
