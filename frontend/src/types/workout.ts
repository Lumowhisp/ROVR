export type ActivityType = 'running' | 'cycling' | 'walking' | 'hiking';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface WorkoutStats {
  distanceKm: number;
  elapsedSeconds: number;
  caloriesBurned: number;
  currentPaceMinPerKm: string;
  avgPaceMinPerKm: string;
  currentSpeedKmh: number;
  avgSpeedKmh: number;
}

export interface WorkoutSummary {
  id: string;
  activityType: ActivityType;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  distanceKm: number;
  caloriesBurned: number;
  avgPace: string;
  avgSpeed: number;
  routeCoordinates: LocationCoordinate[];
  earnedXP: number;
  steps?: number;
}
