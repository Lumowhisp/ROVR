/**
 * Steps Calculator — Pure utility functions for step/activity calculations.
 *
 * All functions are stateless and testable in isolation.
 * Formulas are approximate estimates and clearly documented.
 */

/**
 * Estimate stride length from height and gender.
 *
 * Formula (sports-science heuristic):
 *   Male:   stride_length_cm = height_cm × 0.415
 *   Female: stride_length_cm = height_cm × 0.413
 *   Default (unknown gender): height_cm × 0.414
 *
 * @param {number} height_cm - User height in centimeters
 * @param {string} [gender] - "Male", "Female", or undefined
 * @returns {number} Estimated stride length in centimeters
 */
export function estimateStrideLength(height_cm, gender) {
  if (!height_cm || height_cm <= 0) {
    return 75; // fallback average stride length in cm
  }
  const multiplier =
    gender === "Male" ? 0.415 : gender === "Female" ? 0.413 : 0.414;
  return Math.round(height_cm * multiplier * 100) / 100;
}

/**
 * Calculate distance from steps and stride length.
 *
 * Formula: distance_km = (steps × stride_length_cm) / 100,000
 *
 * @param {number} steps - Number of steps
 * @param {number} stride_length_cm - Stride length in centimeters
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateDistance(steps, stride_length_cm) {
  if (!steps || steps <= 0 || !stride_length_cm || stride_length_cm <= 0) {
    return 0;
  }
  return Math.round((steps * stride_length_cm) / 100000 * 100) / 100;
}

/**
 * Estimate calories burned from walking/stepping activity.
 *
 * Formula (MET-based approximation):
 *   estimated_calories = (weight_kg × distance_km × 0.57) + (active_minutes × weight_kg × 0.035)
 *
 * This is an ESTIMATE. Actual calorie burn varies by individual metabolism,
 * terrain, walking speed, and other factors.
 *
 * @param {number} weight_kg - User weight in kilograms
 * @param {number} distance_km - Distance walked in kilometers
 * @param {number} active_minutes - Minutes of active movement
 * @returns {number} Estimated calories burned (rounded to nearest integer)
 */
export function calculateCalories(weight_kg, distance_km, active_minutes) {
  const weight = weight_kg || 70; // fallback average weight
  const distance = distance_km || 0;
  const minutes = active_minutes || 0;

  const distanceCalories = weight * distance * 0.57;
  const activeCalories = minutes * weight * 0.035;

  return Math.round(distanceCalories + activeCalories);
}

/**
 * Calculate average walking pace.
 *
 * Formula: pace = active_minutes / distance_km (min/km)
 *
 * @param {number} active_minutes - Minutes of active movement
 * @param {number} distance_km - Distance in kilometers
 * @returns {number} Pace in minutes per kilometer (rounded to 1 decimal)
 */
export function calculatePace(active_minutes, distance_km) {
  if (!active_minutes || !distance_km || distance_km <= 0) {
    return 0;
  }
  return Math.round((active_minutes / distance_km) * 10) / 10;
}

/**
 * Calculate goal progress.
 *
 * @param {number} steps - Current step count
 * @param {number} goal - Step goal
 * @returns {{ goal: number, steps: number, progress: number, completed: boolean }}
 */
export function calculateGoalProgress(steps, goal) {
  const currentSteps = steps || 0;
  const currentGoal = goal || 10000;
  const progress =
    Math.round(Math.min((currentSteps / currentGoal) * 100, 100) * 100) / 100;

  return {
    goal: currentGoal,
    steps: currentSteps,
    progress,
    completed: currentSteps >= currentGoal,
  };
}

/**
 * Calculate current streak — consecutive days (backward from yesterday)
 * where the daily step goal was completed.
 *
 * @param {Array<{ date: string, goal_completed: boolean }>} records - Sorted by date descending
 * @returns {number} Current streak count
 */
export function calculateCurrentStreak(records) {
  if (!records || records.length === 0) return 0;

  // Get yesterday's date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Also accept today as valid start
  const todayStr = new Date().toISOString().split("T")[0];

  let streak = 0;
  let expectedDate = new Date();

  // Start from today and work backward
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const expectedStr = expectedDate.toISOString().split("T")[0];

    if (record.date === expectedStr) {
      if (record.goal_completed) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // If today and not completed, skip to yesterday
        if (record.date === todayStr) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          continue;
        }
        break;
      }
    } else if (record.date < expectedStr) {
      // There's a gap — if the gap starts from today, allow it
      if (expectedStr === todayStr) {
        expectedDate.setDate(expectedDate.getDate() - 1);
        i--; // re-check this record against new expected date
        continue;
      }
      break;
    }
  }

  return streak;
}

/**
 * Calculate the longest streak ever achieved.
 *
 * @param {Array<{ date: string, goal_completed: boolean }>} records - Sorted by date ascending
 * @returns {number} Longest streak count
 */
export function calculateLongestStreak(records) {
  if (!records || records.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDate = null;

  for (const record of records) {
    if (!record.goal_completed) {
      current = 0;
      prevDate = null;
      continue;
    }

    if (prevDate) {
      const prev = new Date(prevDate);
      prev.setDate(prev.getDate() + 1);
      const nextExpected = prev.toISOString().split("T")[0];

      if (record.date === nextExpected) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }

    prevDate = record.date;
    if (current > longest) {
      longest = current;
    }
  }

  return longest;
}
