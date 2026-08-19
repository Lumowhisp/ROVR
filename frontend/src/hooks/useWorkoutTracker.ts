import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationCoordinate } from '@/components/map/ActivityMapView';

export type ActivityMode = 'Cycling' | 'Running' | 'Walking' | 'Hiking';
export type WorkoutStatus = 'idle' | 'active' | 'paused' | 'finished';

// Haversine formula for distance between two lat/lng points in kilometers
function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// MET (Metabolic Equivalent of Task) estimates by activity
const MET_VALUES: Record<ActivityMode, number> = {
  Cycling: 8.0,
  Running: 9.8,
  Walking: 3.8,
  Hiking: 6.0,
};

export function useWorkoutTracker(initialMode: ActivityMode = 'Cycling') {
  const [mode, setMode] = useState<ActivityMode>(initialMode);
  const [status, setStatus] = useState<WorkoutStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoordinate[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Request location permission safely
  useEffect(() => {
    (async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const granted = fgStatus === 'granted';
        setPermissionGranted(granted);

        if (granted) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          });
        }
      } catch (err) {
        console.warn('Location initialization warning:', err);
        setPermissionGranted(false);
      }
    })();
  }, []);

  // Duration Timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Derived calorie estimate calculation
  const caloriesBurned = elapsedSeconds > 0
    ? Math.round(MET_VALUES[mode] * 70 * (elapsedSeconds / 3600))
    : 0;

  // Location watching during active workout
  useEffect(() => {
    if (status === 'active' && permissionGranted) {
      (async () => {
        try {
          locationSubRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 2000,
              distanceInterval: 5,
            },
            (loc) => {
              const newCoord: LocationCoordinate = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                altitude: loc.coords.altitude,
                speed: loc.coords.speed,
                timestamp: loc.timestamp,
              };

              setCurrentLocation(newCoord);
              setRouteCoordinates((prev) => {
                if (prev.length > 0) {
                  const lastCoord = prev[prev.length - 1];
                  const incrementalDistance = getDistanceKm(
                    lastCoord.latitude,
                    lastCoord.longitude,
                    newCoord.latitude,
                    newCoord.longitude
                  );
                  setDistanceKm((d) => Math.round((d + incrementalDistance) * 100) / 100);
                }
                return [...prev, newCoord];
              });
            }
          );
        } catch (err) {
          console.warn('Location tracking error:', err);
        }
      })();
    } else {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    }

    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, [status, permissionGranted]);

  const startWorkout = useCallback(() => {
    setStatus('active');
  }, []);

  const pauseWorkout = useCallback(() => {
    setStatus('paused');
  }, []);

  const resumeWorkout = useCallback(() => {
    setStatus('active');
  }, []);

  const stopWorkout = useCallback(() => {
    setStatus('finished');
  }, []);

  const resetWorkout = useCallback(() => {
    setStatus('idle');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setRouteCoordinates([]);
  }, []);

  // Format timer seconds into HH:MM:SS or MM:SS
  const formattedTime = (() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  })();

  // Pace calculation (min/km)
  const formattedPace = (() => {
    if (distanceKm <= 0 || elapsedSeconds <= 0) return '--';
    const paceDecimal = (elapsedSeconds / 60) / distanceKm;
    const paceMins = Math.floor(paceDecimal);
    const paceSecs = Math.round((paceDecimal - paceMins) * 60);
    return `${paceMins}'${paceSecs.toString().padStart(2, '0')}"`;
  })();

  return {
    mode,
    setMode,
    status,
    elapsedSeconds,
    formattedTime,
    distanceKm,
    formattedPace,
    caloriesBurned,
    currentLocation,
    routeCoordinates,
    permissionGranted,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    resetWorkout,
  };
}
