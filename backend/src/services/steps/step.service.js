/**
 * Step Service — Core sync and retrieval logic for daily activity records.
 */

import { User } from "../../models/user.model.js";
import { DailyActivity } from "../../models/dailyActivity.model.js";
import { calculateDistanceForUser } from "./distance.service.js";
import { estimateCaloriesForUser } from "./calorie.service.js";
import {
  calculatePace,
  calculateGoalProgress,
} from "../../utils/steps_calculator.js";

/**
 * Validate the date string format (YYYY-MM-DD) and ensure it's not in the future.
 *
 * @param {string} dateStr
 * @returns {{ valid: boolean, error?: string }}
 */
function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return { valid: false, error: "Date is required" };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }

  const parsed = new Date(dateStr + "T00:00:00Z");
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: "Invalid date value" };
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { valid: false, error: "Invalid calendar date" };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    return { valid: false, error: "Date cannot be in the future" };
  }

  return { valid: true };
}

/**
 * Sync step data from the mobile/device layer.
 * Creates or updates the daily activity record (upsert).
 *
 * @param {string} userId
 * @param {{ date: string, steps: number, active_minutes?: number, sync_mode?: string }} data
 * @returns {Promise<object>} The upserted daily activity record
 */
export async function syncSteps(userId, data) {
  const { date, steps, active_minutes, sync_mode } = data;

  // Validate sync_mode if provided
  if (sync_mode !== undefined && sync_mode !== null) {
    const validModes = ["cumulative", "incremental", "delta"];
    if (!validModes.includes(sync_mode)) {
      throw new Error("Invalid sync_mode");
    }
  }

  // Validate date
  const dateCheck = validateDate(date);
  if (!dateCheck.valid) {
    throw new Error(dateCheck.error);
  }

  // Validate steps
  if (steps === undefined || steps === null) {
    throw new Error("Steps value is required");
  }
  if (typeof steps !== "number" || !Number.isFinite(steps)) {
    throw new Error("Steps must be a valid number");
  }
  if (steps < 0) {
    throw new Error("Steps cannot be negative");
  }
  if (steps > 500000) {
    throw new Error("Steps value exceeds reasonable maximum (500,000)");
  }
  if (!Number.isInteger(steps)) {
    throw new Error("Steps must be a whole number");
  }

  // Validate active_minutes
  const activeMin = active_minutes || 0;
  if (typeof activeMin !== "number" || !Number.isFinite(activeMin)) {
    throw new Error("Active minutes must be a valid number");
  }
  if (activeMin < 0) {
    throw new Error("Active minutes cannot be negative");
  }
  if (activeMin > 1440) {
    throw new Error("Active minutes cannot exceed 1440 (24 hours)");
  }
  if (!Number.isInteger(activeMin)) {
    throw new Error("Active minutes must be a whole number");
  }

  // Fetch user for goal
  const user = await User.findById(userId).select("daily_step_goal");
  if (!user) {
    throw new Error("User not found");
  }

  const goalSteps = user.daily_step_goal || 10000;

  // Resolve steps & active minutes based on sync_mode (cumulative vs incremental)
  let finalSteps = steps;
  let finalActiveMin = activeMin;

  if (sync_mode === "incremental" || sync_mode === "delta") {
    const existing = await DailyActivity.findOne({ user: userId, date });
    if (existing) {
      finalSteps = existing.steps + steps;
      finalActiveMin = existing.active_minutes + activeMin;
    }
  }

  // Calculate derived metrics
  const distance_km = await calculateDistanceForUser(finalSteps, userId);
  const estimated_calories_burned = await estimateCaloriesForUser(
    userId,
    distance_km,
    finalActiveMin
  );
  const avg_pace = calculatePace(finalActiveMin, distance_km);
  const goal_completed = finalSteps >= goalSteps;

  // Upsert the daily activity record
  const activity = await DailyActivity.findOneAndUpdate(
    { user: userId, date },
    {
      steps: finalSteps,
      distance_km,
      estimated_calories_burned,
      active_calories: estimated_calories_burned,
      active_minutes: finalActiveMin,
      avg_pace,
      goal_steps: goalSteps,
      goal_completed,
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return activity;
}

/**
 * Get today's activity for a user, including goal progress.
 *
 * @param {string} userId
 * @param {string} [clientDate] - Optional client local date (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
export async function getToday(userId, clientDate) {
  const user = await User.findById(userId).select("daily_step_goal");
  if (!user) {
    throw new Error("User not found");
  }

  let today = clientDate;
  if (today) {
    const check = validateDate(today);
    if (!check.valid) {
      throw new Error(`Invalid date: ${check.error}`);
    }
  } else {
    today = new Date().toISOString().split("T")[0];
  }

  const activity = await DailyActivity.findOne({ user: userId, date: today });

  const goalSteps = user.daily_step_goal || 10000;

  if (!activity) {
    const progress = calculateGoalProgress(0, goalSteps);
    return {
      date: today,
      steps: 0,
      distance_km: 0,
      estimated_calories_burned: 0,
      active_calories: 0,
      active_minutes: 0,
      avg_pace: 0,
      goal: goalSteps,
      goal_progress: progress.progress,
      goal_completed: false,
    };
  }

  const progress = calculateGoalProgress(activity.steps, goalSteps);

  return {
    date: activity.date,
    steps: activity.steps,
    distance_km: activity.distance_km,
    estimated_calories_burned: activity.estimated_calories_burned,
    active_calories: activity.active_calories,
    active_minutes: activity.active_minutes,
    avg_pace: activity.avg_pace,
    goal: goalSteps,
    goal_progress: progress.progress,
    goal_completed: activity.goal_completed,
  };
}

/**
 * Get activity history for a user within a date range.
 *
 * @param {string} userId
 * @param {string} [startDate] - YYYY-MM-DD
 * @param {string} [endDate] - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getHistory(userId, startDate, endDate) {
  const query = { user: userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const startCheck = validateDate(startDate);
      if (!startCheck.valid) {
        throw new Error(`Invalid start_date: ${startCheck.error}`);
      }
      query.date.$gte = startDate;
    }
    if (endDate) {
      const endCheck = validateDate(endDate);
      if (!endCheck.valid) {
        throw new Error(`Invalid end_date: ${endCheck.error}`);
      }
      query.date.$lte = endDate;
    }
  }

  const records = await DailyActivity.find(query)
    .sort({ date: -1 })
    .select("-__v")
    .lean();

  return records.map((r) => ({
    date: r.date,
    steps: r.steps,
    distance_km: r.distance_km,
    estimated_calories_burned: r.estimated_calories_burned,
    active_minutes: r.active_minutes,
    goal_steps: r.goal_steps,
    goal_completed: r.goal_completed,
  }));
}
