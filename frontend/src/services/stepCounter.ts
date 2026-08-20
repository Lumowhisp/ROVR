import { Pedometer, Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TODAY_STEPS_KEY_PREFIX = 'rovr_daily_steps_';

function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const stepCounterService = {
  /**
   * Request pedometer and motion permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    try {
      const isAvail = await Pedometer.isAvailableAsync();
      if (isAvail) {
        const { status } = await Pedometer.requestPermissionsAsync();
        return status === 'granted';
      }
      // Accelerometer does not require special runtime permission
      return true;
    } catch {
      return true;
    }
  },

  /**
   * Check if hardware pedometer sensor is available on device
   */
  isAvailable: async (): Promise<boolean> => {
    try {
      return await Pedometer.isAvailableAsync();
    } catch {
      return false;
    }
  },

  /**
   * Retrieve today's step count (from pedometer sensor or stored cache)
   */
  getTodaySteps: async (): Promise<number> => {
    const key = `${TODAY_STEPS_KEY_PREFIX}${getTodayDateKey()}`;

    // Date range querying is supported on iOS in Expo Pedometer
    if (Platform.OS === 'ios') {
      try {
        const isAvail = await Pedometer.isAvailableAsync();
        if (isAvail) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date();

          const result = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
          if (result && typeof result.steps === 'number') {
            await AsyncStorage.setItem(key, result.steps.toString());
            return result.steps;
          }
        }
      } catch {
        // Fall back to stored
      }
    }

    // On Android or fallback: get persisted accumulated steps for today
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Add workout or live steps to today's accumulation
   */
  addSteps: async (count: number): Promise<number> => {
    if (count <= 0) return 0;
    const key = `${TODAY_STEPS_KEY_PREFIX}${getTodayDateKey()}`;
    try {
      const current = await stepCounterService.getTodaySteps();
      const updated = current + count;
      await AsyncStorage.setItem(key, updated.toString());
      return updated;
    } catch {
      return count;
    }
  },

  /**
   * Subscribe to live real-time step streams using dual Pedometer + Accelerometer peak detection
   */
  subscribeLive: (onStepDelta: (delta: number) => void) => {
    let lastPedometerSteps = 0;
    let pedometerSub: any = null;
    let accelSub: any = null;
    let lastStepTime = 0;
    let peakDetected = false;

    // 1. Try native hardware pedometer stream
    try {
      pedometerSub = Pedometer.watchStepCount((result) => {
        if (result && typeof result.steps === 'number') {
          const currentTotal = result.steps;
          const delta = currentTotal - lastPedometerSteps;
          if (delta > 0 && delta < 50) {
            lastPedometerSteps = currentTotal;
            onStepDelta(delta);
          } else if (lastPedometerSteps === 0) {
            lastPedometerSteps = currentTotal;
          }
        }
      });
    } catch (err) {
      console.log('Pedometer watch notice:', err);
    }

    // 2. Universal Accelerometer Heel-Strike Step Detector (works on 100% of Android/iOS devices)
    try {
      Accelerometer.setUpdateInterval(100); // 10 Hz
      accelSub = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        // Step peak detection window (min 260ms between human steps = max 3.8 steps/sec)
        if (magnitude > 1.22) {
          peakDetected = true;
        } else if (peakDetected && magnitude < 0.96) {
          if (now - lastStepTime > 260) {
            lastStepTime = now;
            peakDetected = false;
            onStepDelta(1);
          }
        }
      });
    } catch (err) {
      console.log('Accelerometer step detector notice:', err);
    }

    return {
      remove: () => {
        if (pedometerSub && typeof pedometerSub.remove === 'function') {
          pedometerSub.remove();
        }
        if (accelSub && typeof accelSub.remove === 'function') {
          accelSub.remove();
        }
      },
    };
  },
};
