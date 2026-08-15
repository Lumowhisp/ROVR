/**
 * Analytics Service — Weekly, monthly, and all-time statistics and streaks.
 */

import { DailyActivity } from "../../models/dailyActivity.model.js";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
} from "../../utils/steps_calculator.js";

/**
 * Helper to get a date string N days ago.
 *
 * @param {number} days
 * @returns {string} YYYY-MM-DD
 */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * Aggregate statistics from an array of activity records.
 *
 * @param {Array} records
 * @returns {object}
 */
function aggregateRecords(records) {
  if (!records || records.length === 0) {
    return {
      total_steps: 0,
      avg_steps_per_day: 0,
      total_distance_km: 0,
      total_calories: 0,
      total_active_minutes: 0,
      best_day: null,
      goals_completed: 0,
      days_tracked: 0,
    };
  }

  let totalSteps = 0;
  let totalDistance = 0;
  let totalCalories = 0;
  let totalActiveMinutes = 0;
  let goalsCompleted = 0;
  let bestDay = null;
  let bestSteps = -1;

  for (const r of records) {
    totalSteps += r.steps || 0;
    totalDistance += r.distance_km || 0;
    totalCalories += r.estimated_calories_burned || 0;
    totalActiveMinutes += r.active_minutes || 0;
    if (r.goal_completed) goalsCompleted++;

    if ((r.steps || 0) > bestSteps) {
      bestSteps = r.steps || 0;
      bestDay = {
        date: r.date,
        steps: r.steps,
        distance_km: r.distance_km,
        estimated_calories_burned: r.estimated_calories_burned,
      };
    }
  }

  return {
    total_steps: totalSteps,
    avg_steps_per_day: Math.round(totalSteps / records.length),
    total_distance_km: Math.round(totalDistance * 100) / 100,
    total_calories: Math.round(totalCalories),
    total_active_minutes: totalActiveMinutes,
    best_day: bestDay,
    goals_completed: goalsCompleted,
    days_tracked: records.length,
  };
}

/**
 * Get weekly statistics (last 7 days).
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getWeeklyStats(userId) {
  const startDate = daysAgo(6);
  const today = new Date().toISOString().split("T")[0];

  const records = await DailyActivity.find({
    user: userId,
    date: { $gte: startDate, $lte: today },
  })
    .sort({ date: 1 })
    .lean();

  const stats = aggregateRecords(records);

  // Add streak info for weekly
  const allRecords = await DailyActivity.find({ user: userId })
    .sort({ date: -1 })
    .select("date goal_completed")
    .lean();

  stats.current_streak = calculateCurrentStreak(allRecords);
  stats.period = { start: startDate, end: today };

  return stats;
}

/**
 * Get monthly statistics (last 30 days).
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getMonthlyStats(userId) {
  const startDate = daysAgo(29);
  const today = new Date().toISOString().split("T")[0];

  const records = await DailyActivity.find({
    user: userId,
    date: { $gte: startDate, $lte: today },
  })
    .sort({ date: 1 })
    .lean();

  const stats = aggregateRecords(records);

  // Add personal best for the month
  const allTimeRecords = await DailyActivity.find({ user: userId })
    .sort({ date: 1 })
    .select("date goal_completed steps distance_km estimated_calories_burned")
    .lean();

  // Personal best is from the monthly records
  stats.personal_best = stats.best_day;
  stats.longest_streak = calculateLongestStreak(
    allTimeRecords.map((r) => ({
      date: r.date,
      goal_completed: r.goal_completed,
    }))
  );
  stats.period = { start: startDate, end: today };

  return stats;
}

/**
 * Get all-time personal bests and overall statistics.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getOverallStats(userId) {
  const records = await DailyActivity.find({ user: userId })
    .sort({ date: 1 })
    .lean();

  if (!records || records.length === 0) {
    return {
      total_days_tracked: 0,
      highest_steps_in_a_day: null,
      longest_distance_in_a_day: null,
      highest_calories_in_a_day: null,
      avg_steps: 0,
    };
  }

  let highestSteps = { steps: 0, date: null };
  let longestDistance = { distance_km: 0, date: null };
  let highestCalories = { estimated_calories_burned: 0, date: null };
  let totalSteps = 0;

  for (const r of records) {
    totalSteps += r.steps || 0;

    if ((r.steps || 0) > highestSteps.steps) {
      highestSteps = { steps: r.steps, date: r.date };
    }
    if ((r.distance_km || 0) > longestDistance.distance_km) {
      longestDistance = { distance_km: r.distance_km, date: r.date };
    }
    if (
      (r.estimated_calories_burned || 0) >
      highestCalories.estimated_calories_burned
    ) {
      highestCalories = {
        estimated_calories_burned: r.estimated_calories_burned,
        date: r.date,
      };
    }
  }

  return {
    total_days_tracked: records.length,
    highest_steps_in_a_day: highestSteps,
    longest_distance_in_a_day: longestDistance,
    highest_calories_in_a_day: highestCalories,
    avg_steps: Math.round(totalSteps / records.length),
  };
}

/**
 * Get current and longest streak.
 *
 * @param {string} userId
 * @returns {Promise<{ current_streak: number, longest_streak: number }>}
 */
export async function getStreaks(userId) {
  const records = await DailyActivity.find({ user: userId })
    .sort({ date: 1 })
    .select("date goal_completed")
    .lean();

  const recordsDesc = [...records].reverse();

  return {
    current_streak: calculateCurrentStreak(recordsDesc),
    longest_streak: calculateLongestStreak(records),
  };
}
