import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSummary } from '@/types/workout';

const WORKOUT_HISTORY_KEY = 'rovr_workout_history';
const WORKOUT_STATS_KEY = 'rovr_cumulative_stats';

export interface CumulativeStats {
  totalWorkouts: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalXP: number;
  totalSteps: number;
}

export const workoutStorage = {
  /**
   * Save a newly finished workout session to persistent storage
   */
  saveWorkout: async (workout: WorkoutSummary): Promise<void> => {
    try {
      const existing = await workoutStorage.getAllWorkouts();
      const updated = [workout, ...existing];
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updated));

      // Calculate steps if not provided: ~1300 steps/km for walk/run
      const sessionSteps = workout.steps || (workout.activityType !== 'cycling' ? Math.round(workout.distanceKm * 1300) : 0);

      // Update cumulative stats
      const stats = await workoutStorage.getCumulativeStats();
      const newStats: CumulativeStats = {
        totalWorkouts: stats.totalWorkouts + 1,
        totalDistanceKm: Number((stats.totalDistanceKm + workout.distanceKm).toFixed(2)),
        totalDurationSeconds: stats.totalDurationSeconds + workout.durationSeconds,
        totalCaloriesBurned: stats.totalCaloriesBurned + workout.caloriesBurned,
        totalXP: stats.totalXP + workout.earnedXP,
        totalSteps: (stats.totalSteps || 0) + sessionSteps,
      };
      await AsyncStorage.setItem(WORKOUT_STATS_KEY, JSON.stringify(newStats));
    } catch (err) {
      console.log('Error saving workout to storage:', err);
    }
  },

  /**
   * Retrieve all saved workouts (newest first)
   */
  getAllWorkouts: async (): Promise<WorkoutSummary[]> => {
    try {
      const data = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieve cumulative athlete statistics
   */
  getCumulativeStats: async (): Promise<CumulativeStats> => {
    try {
      const data = await AsyncStorage.getItem(WORKOUT_STATS_KEY);
      return data
        ? JSON.parse(data)
        : {
            totalWorkouts: 0,
            totalDistanceKm: 0,
            totalDurationSeconds: 0,
            totalCaloriesBurned: 0,
            totalXP: 0,
            totalSteps: 0,
          };
    } catch {
      return {
        totalWorkouts: 0,
        totalDistanceKm: 0,
        totalDurationSeconds: 0,
        totalCaloriesBurned: 0,
        totalXP: 0,
        totalSteps: 0,
      };
    }
  },

  /**
   * Clear all workout history (for debugging/reset)
   */
  clearHistory: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
      await AsyncStorage.removeItem(WORKOUT_STATS_KEY);
    } catch (err) {
      console.log('Error clearing workout history:', err);
    }
  },
};
