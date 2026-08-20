import { Workout } from "../models/workout.model.js";
import { DailyActivity } from "../models/dailyActivity.model.js";

/**
 * Save or update a finished workout session
 */
export const saveWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id,
      workoutId: clientWorkoutId,
      activityType,
      startTime,
      endTime,
      durationSeconds,
      distanceKm,
      caloriesBurned,
      avgPace,
      avgSpeed,
      routeCoordinates,
      earnedXP,
      steps,
    } = req.body;

    const finalWorkoutId = id || clientWorkoutId || `workout_${Date.now()}`;
    const startedAt = startTime || (endTime ? endTime - (durationSeconds * 1000) : Date.now());
    const completedAt = endTime || Date.now();

    const computedSteps = steps || (activityType !== "cycling" ? Math.round((distanceKm || 0) * 1300) : 0);

    const workout = await Workout.findOneAndUpdate(
      { user: userId, workoutId: finalWorkoutId },
      {
        user: userId,
        workoutId: finalWorkoutId,
        activityType: activityType || "running",
        distanceKm: distanceKm || 0,
        durationSeconds: durationSeconds || 0,
        caloriesBurned: caloriesBurned || 0,
        avgPace: avgPace || "0'00\"",
        avgSpeed: avgSpeed || 0,
        earnedXP: earnedXP || 0,
        steps: computedSteps,
        routeCoordinates: routeCoordinates || [],
        startedAt,
        completedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Sync to DailyActivity for today
    try {
      const today = new Date(completedAt).toISOString().split("T")[0];
      const activeMins = Math.round((durationSeconds || 0) / 60);

      await DailyActivity.findOneAndUpdate(
        { user: userId, date: today },
        {
          $inc: {
            steps: computedSteps,
            distance_km: distanceKm || 0,
            active_calories: caloriesBurned || 0,
            active_minutes: activeMins,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (activityErr) {
      console.log("Error updating DailyActivity from workout:", activityErr);
    }

    res.status(200).json({
      success: true,
      message: "Workout saved successfully",
      data: workout,
    });
  } catch (error) {
    console.error("Error saving workout:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error saving workout",
    });
  }
};

/**
 * Get all workouts for authenticated user (newest first)
 */
export const getUserWorkouts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const workouts = await Workout.find({ user: userId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Workout.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: workouts.length,
      total,
      data: workouts,
    });
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching workouts",
    });
  }
};

/**
 * Get cumulative aggregate statistics for user
 */
export const getUserWorkoutStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Workout.aggregate([
      { $match: { user: new (await import("mongoose")).default.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDistanceKm: { $sum: "$distanceKm" },
          totalDurationSeconds: { $sum: "$durationSeconds" },
          totalCaloriesBurned: { $sum: "$caloriesBurned" },
          totalXP: { $sum: "$earnedXP" },
          totalSteps: { $sum: "$steps" },
        },
      },
    ]);

    const result = stats[0] || {
      totalWorkouts: 0,
      totalDistanceKm: 0,
      totalDurationSeconds: 0,
      totalCaloriesBurned: 0,
      totalXP: 0,
      totalSteps: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts: result.totalWorkouts || 0,
        totalDistanceKm: Number((result.totalDistanceKm || 0).toFixed(2)),
        totalDurationSeconds: result.totalDurationSeconds || 0,
        totalCaloriesBurned: result.totalCaloriesBurned || 0,
        totalXP: result.totalXP || 0,
        totalSteps: result.totalSteps || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching workout stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching workout stats",
    });
  }
};

/**
 * Get single workout details
 */
export const getWorkoutById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const workout = await Workout.findOne({
      user: userId,
      $or: [{ workoutId: id }, { _id: id }],
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Delete a workout session
 */
export const deleteWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await Workout.findOneAndDelete({
      user: userId,
      $or: [{ workoutId: id }, { _id: id }],
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
