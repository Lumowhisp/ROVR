import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutAPI } from '@/services/api';
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

let activeSyncPromise: Promise<WorkoutSummary[]> | null = null;

export const workoutStorage = {
  /**
   * Save a newly finished workout session to both local AsyncStorage and remote MongoDB
   */
  saveWorkout: async (workout: WorkoutSummary): Promise<void> => {
    try {
      const existing = await workoutStorage.getAllWorkouts();
      // Avoid duplicate workout ids in local list
      const filtered = existing.filter((w) => w.id !== workout.id);
      const updated = [workout, ...filtered];
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

      // Cloud MongoDB Sync (Fire & Forget)
      workoutAPI.saveWorkout(workout).catch(() => {});
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
   * Sync remote workouts from MongoDB into local AsyncStorage.
   * Useful on multi-device sign-in or app launch.
   */
  syncFromCloud: async (): Promise<WorkoutSummary[]> => {
    if (activeSyncPromise) {
      return activeSyncPromise;
    }

    activeSyncPromise = (async () => {
      try {
        const res = await workoutAPI.getWorkouts({ limit: 100 });
        if (res && res.success && Array.isArray(res.data)) {
          const cloudWorkouts: WorkoutSummary[] = res.data.map((item: any) => ({
            id: item.workoutId || item._id,
            activityType: item.activityType || 'running',
            startTime: item.startedAt || Date.now(),
            endTime: item.completedAt || Date.now(),
            durationSeconds: item.durationSeconds || 0,
            distanceKm: item.distanceKm || 0,
            caloriesBurned: item.caloriesBurned || 0,
            avgPace: item.avgPace || "0'00\"",
            avgSpeed: item.avgSpeed || 0,
            routeCoordinates: item.routeCoordinates || [],
            earnedXP: item.earnedXP || 0,
            steps: item.steps || 0,
          }));

          const localWorkouts = await workoutStorage.getAllWorkouts();

          // Merge without duplicates (favoring cloud objects)
          const workoutMap = new Map<string, WorkoutSummary>();
          localWorkouts.forEach((w) => workoutMap.set(w.id, w));
          cloudWorkouts.forEach((w) => workoutMap.set(w.id, w));

          const merged = Array.from(workoutMap.values()).sort(
            (a, b) => b.endTime - a.endTime
          );

          await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(merged));

          // Recompute cumulative stats
          let totalWorkouts = merged.length;
          let totalDistanceKm = 0;
          let totalDurationSeconds = 0;
          let totalCaloriesBurned = 0;
          let totalXP = 0;
          let totalSteps = 0;

          merged.forEach((w) => {
            totalDistanceKm += w.distanceKm || 0;
            totalDurationSeconds += w.durationSeconds || 0;
            totalCaloriesBurned += w.caloriesBurned || 0;
            totalXP += w.earnedXP || 0;
            totalSteps += w.steps || (w.activityType !== 'cycling' ? Math.round((w.distanceKm || 0) * 1300) : 0);
          });

          const newStats: CumulativeStats = {
            totalWorkouts,
            totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
            totalDurationSeconds,
            totalCaloriesBurned,
            totalXP,
            totalSteps,
          };

          await AsyncStorage.setItem(WORKOUT_STATS_KEY, JSON.stringify(newStats));
          return merged;
        }
      } catch {
        // Silently fall back to cached local storage
      } finally {
        activeSyncPromise = null;
      }
      return workoutStorage.getAllWorkouts();
    })();

    return activeSyncPromise;
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
   * Clear all workout history (for debugging/reset/logout)
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
