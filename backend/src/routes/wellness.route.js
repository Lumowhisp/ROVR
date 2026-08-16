import express from "express";
import { protect } from "../Middleware/protect.js";
import {
  createCycle,
  getCurrentCycle,
  getCycleHistory,
} from "../services/wellness/cycle.service.js";
import {
  upsertDailyLog,
  getDailyLog,
} from "../services/wellness/dailyLog.service.js";
import { generateRecommendations } from "../services/wellness/recommendation.service.js";
import { DailyLog } from "../models/dailyLog.model.js";

const router = express.Router();

// Same status-inference approach as steps.route.js — no separate error-code
// enum exists in this codebase yet, so this matches the established pattern
// rather than introducing a new one.
function statusFromError(message) {
  if (message.includes("not found")) return 404;
  if (
    message.includes("required") ||
    message.includes("Invalid") ||
    message.includes("must")
  ) {
    return 400;
  }
  return 500;
}

/**
 * POST /api/wellness/cycle
 * Body: { cycleStart: "YYYY-MM-DD", cycleEnd?, periodLength? }
 */
router.post("/cycle", protect, async (req, res) => {
  try {
    const cycle = await createCycle(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: "Cycle logged successfully",
      data: cycle,
    });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wellness/cycle/current
 * Returns the latest cycle, its computed phase, and the next-period prediction.
 */
router.get("/cycle/current", protect, async (req, res) => {
  try {
    const data = await getCurrentCycle(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wellness/cycle/history
 */
router.get("/cycle/history", protect, async (req, res) => {
  try {
    const data = await getCycleHistory(req.user.id);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * POST /api/wellness/daily-log
 * Body: { date, flow?, painLevel?, symptoms?, mood?, notes? }
 */
router.post("/daily-log", protect, async (req, res) => {
  try {
    const log = await upsertDailyLog(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Daily log saved",
      data: log,
    });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wellness/daily-log/:date
 */
router.get("/daily-log/:date", protect, async (req, res) => {
  try {
    const log = await getDailyLog(req.user.id, req.params.date);
    return res.status(200).json({ success: true, data: log });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wellness/calendar?month=YYYY-MM
 * Derived view — no separate calendar storage, just phase + logs for the month.
 */
router.get("/calendar", protect, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Invalid month. Use YYYY-MM format");
    }

    const [current, logsInMonth] = await Promise.all([
      getCurrentCycle(req.user.id),
      DailyLog.find({ user: req.user.id, date: { $regex: `^${month}` } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        phase: current.phase,
        prediction: current.prediction,
        logs: logsInMonth,
      },
    });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wellness/recommendations
 * Rule-based only — see recommendation.service.js. Reads today's symptoms
 * if a log already exists, otherwise falls back to phase-only guidance.
 */
router.get("/recommendations", protect, async (req, res) => {
  try {
    const current = await getCurrentCycle(req.user.id);
    const today = new Date().toISOString().split("T")[0];

    let todaySymptoms = [];
    try {
      const log = await getDailyLog(req.user.id, today);
      todaySymptoms = log.symptoms || [];
    } catch {
      // No log for today yet — recommendations still work off phase alone.
    }

    const recommendations = generateRecommendations({
      phase: current.phase.phase,
      symptoms: todaySymptoms,
    });

    return res.status(200).json({
      success: true,
      data: { phase: current.phase, recommendations },
    });
  } catch (error) {
    return res
      .status(statusFromError(error.message))
      .json({ success: false, message: error.message });
  }
});

export default router;
