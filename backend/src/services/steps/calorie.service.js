/**
 * Calorie Service — Estimates calories burned for a user's activity.
 */

import { User } from "../../models/user.model.js";
import { calculateCalories } from "../../utils/steps_calculator.js";

/**
 * Estimate calories burned for a user given distance and active minutes.
 *
 * @param {string} userId
 * @param {number} distance_km
 * @param {number} active_minutes
 * @returns {Promise<number>} Estimated calories burned
 */
export async function estimateCaloriesForUser(
  userId,
  distance_km,
  active_minutes
) {
  const user = await User.findById(userId).select("weight");
  if (!user) {
    throw new Error("User not found");
  }

  return calculateCalories(user.weight, distance_km, active_minutes);
}
