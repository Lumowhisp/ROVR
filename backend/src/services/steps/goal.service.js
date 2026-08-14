/**
 * Goal Service — Manages user daily step goals.
 */

import { User } from "../../models/user.model.js";
import { calculateGoalProgress } from "../../utils/steps_calculator.js";
import { DailyActivity } from "../../models/dailyActivity.model.js";

/**
 * Get the current daily step goal for a user.
 *
 * @param {string} userId
 * @returns {Promise<{ goal: number }>}
 */
export async function getGoal(userId) {
  const user = await User.findById(userId).select("daily_step_goal");
  if (!user) {
    throw new Error("User not found");
  }
  return { goal: user.daily_step_goal || 10000 };
}

/**
 * Update the user's daily step goal.
 *
 * @param {string} userId
 * @param {number} newGoal
 * @returns {Promise<{ goal: number }>}
 */
export async function updateGoal(userId, newGoal) {
  if (!newGoal || newGoal <= 0 || !Number.isInteger(newGoal)) {
    throw new Error("Goal must be a positive integer");
  }
  if (newGoal > 200000) {
    throw new Error("Goal exceeds reasonable maximum (200,000 steps)");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { daily_step_goal: newGoal },
    { returnDocument: "after" }
  );
  if (!user) {
    throw new Error("User not found");
  }

  return { goal: user.daily_step_goal };
}

/**
 * Get current goal progress for today.
 *
 * @param {string} userId
 * @returns {Promise<{ goal: number, steps: number, progress: number, completed: boolean }>}
 */
export async function getGoalProgress(userId) {
  const user = await User.findById(userId).select("daily_step_goal");
  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date().toISOString().split("T")[0];
  const activity = await DailyActivity.findOne({ user: userId, date: today });

  const steps = activity ? activity.steps : 0;
  const goal = user.daily_step_goal || 10000;

  return calculateGoalProgress(steps, goal);
}
