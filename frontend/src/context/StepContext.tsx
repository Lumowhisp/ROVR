import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { stepCounterService } from '@/services/stepCounter';

interface StepContextType {
  todaySteps: number;
  addWorkoutSteps: (count: number) => Promise<void>;
  refreshSteps: () => Promise<void>;
}

const StepContext = createContext<StepContextType>({
  todaySteps: 0,
  addWorkoutSteps: async () => {},
  refreshSteps: async () => {},
});

export function StepProvider({ children }: { children: React.ReactNode }) {
  const [todaySteps, setTodaySteps] = useState(0);

  const refreshSteps = useCallback(async () => {
    const steps = await stepCounterService.getTodaySteps();
    setTodaySteps(steps);
  }, []);

  const addWorkoutSteps = useCallback(async (count: number) => {
    if (count <= 0) return;
    const updated = await stepCounterService.addSteps(count);
    setTodaySteps(updated);
  }, []);

  // Global continuous step counter while app is in foreground
  useEffect(() => {
    let sub: any = null;

    async function initGlobalStepTracking() {
      await stepCounterService.requestPermissions();
      const initial = await stepCounterService.getTodaySteps();
      setTodaySteps(initial);

      // Start continuous stream
      sub = stepCounterService.subscribeLive((deltaSteps) => {
        setTodaySteps((prev) => {
          const next = prev + deltaSteps;
          stepCounterService.addSteps(deltaSteps);
          return next;
        });
      });
    }

    initGlobalStepTracking();

    // Re-sync when app returns to active foreground
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshSteps();
      }
    });

    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
      appStateSub.remove();
    };
  }, [refreshSteps]);

  return (
    <StepContext.Provider value={{ todaySteps, addWorkoutSteps, refreshSteps }}>
      {children}
    </StepContext.Provider>
  );
}

export function useSteps() {
  return useContext(StepContext);
}
