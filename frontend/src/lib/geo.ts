import type { ActivityType, LocationCoordinate } from '@/types/workout';

/**
 * Calculates the great-circle distance between two points on the Earth (Haversine formula).
 * Returns distance in kilometers.
 */
export function calculateHaversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the total path distance from an array of coordinates in km.
 */
export function calculateTotalDistance(coordinates: LocationCoordinate[]): number {
  if (coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += calculateHaversineDistance(coordinates[i - 1], coordinates[i]);
  }
  return total;
}

/**
 * Formats elapsed seconds into HH:MM:SS or MM:SS string.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates and formats average pace in min/km format (e.g. 5'24" /km).
 */
export function formatPace(elapsedSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0.02 || elapsedSeconds <= 0) return "--'--\"";
  const paceSecondsPerKm = elapsedSeconds / distanceKm;
  if (paceSecondsPerKm > 3600) return "--'--\""; // Cap unrealistic pace
  const paceMins = Math.floor(paceSecondsPerKm / 60);
  const paceSecs = Math.floor(paceSecondsPerKm % 60);
  return `${paceMins}'${paceSecs < 10 ? '0' : ''}${paceSecs}"`;
}

/**
 * Calculates estimated active calories burned based on activity type, distance covered, and user weight.
 * Active calories are distance/work-based so they do NOT increase when the user is stationary.
 */
export function calculateCalories(
  activityType: ActivityType,
  distanceKm: number,
  durationSeconds: number,
  weightKg: number = 70
): number {
  if (distanceKm <= 0.005) return 0;

  // Active calorie burn factor (kcal per kg per km)
  // Running: ~1.02 kcal/kg/km, Walking: ~0.72 kcal/kg/km, Cycling: ~0.38 kcal/kg/km, Hiking: ~0.85 kcal/kg/km
  const calPerKmPerKg: Record<ActivityType, number> = {
    running: 1.02,
    cycling: 0.38,
    walking: 0.72,
    hiking: 0.85,
  };

  const factor = calPerKmPerKg[activityType] || 0.75;
  const calories = distanceKm * weightKg * factor;
  return Math.max(0, Math.round(calories));
}

/**
 * Calculates ROVR XP earned based on activity type, distance, and duration.
 */
export function calculateWorkoutXP(
  activityType: ActivityType,
  distanceKm: number,
  durationSeconds: number
): number {
  const baseXP = 50; // Base completion XP
  const distanceXP = Math.round(distanceKm * 25); // +25 XP per km
  const timeXP = Math.round((durationSeconds / 60) * 2); // +2 XP per minute

  const multiplier: Record<ActivityType, number> = {
    running: 1.2,
    cycling: 1.0,
    hiking: 1.3,
    walking: 1.0,
  };

  const total = (baseXP + distanceXP + timeXP) * (multiplier[activityType] || 1.0);
  return Math.max(10, Math.round(total));
}

/**
 * Generates an epoch timestamp (extracted for React purity compliance).
 */
export function getCurrentTimestamp(): number {
  return new Date().getTime();
}

/**
 * Generates a unique workout ID.
 */
export function generateWorkoutId(): string {
  return `${new Date().getTime()}`;
}

