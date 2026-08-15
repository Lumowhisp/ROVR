/**
 * Distance Service — Resolves stride length and calculates distance.
 */

import { User } from "../../models/user.model.js";
import {
  estimateStrideLength,
  calculateDistance,
} from "../../utils/steps_calculator.js";

/**
 * Get the effective stride length for a user.
 * Uses the user's explicit stride_length if set, otherwise estimates from height/gender.
 *
 * @param {string} userId
 * @returns {Promise<number>} Stride length in centimeters
 */
export async function getStrideLengthForUser(userId) {
  const user = await User.findById(userId).select(
    "stride_length height gender"
  );
  if (!user) {
    throw new Error("User not found");
  }

  if (user.stride_length && user.stride_length > 0) {
    return user.stride_length;
  }

  return estimateStrideLength(user.height, user.gender);
}

/**
 * Calculate distance in km for a given step count and user.
 *
 * @param {number} steps
 * @param {string} userId
 * @returns {Promise<number>} Distance in kilometers
 */
export async function calculateDistanceForUser(steps, userId) {
  const strideLength = await getStrideLengthForUser(userId);
  return calculateDistance(steps, strideLength);
}
