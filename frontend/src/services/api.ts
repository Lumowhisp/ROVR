import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { WorkoutSummary } from '@/types/workout';

// Prioritize explicit Render backend URL from env, fallback to production Render URL or local dev
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true') {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ||
      (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
  }

  return 'https://rovr.onrender.com';
};

const BASE_URL = getBaseUrl();
console.log('📡 ROVR Connected API Base URL:', BASE_URL);

// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('rovr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const authAPI = {
  signUp: async (name: string, email: string, password: string) => {
    const response = await api.post('/api/auth/signup', {
      name,
      email,
      password,
    });
    return response.data;
  },

  signIn: async (email: string, password: string) => {
    const response = await api.post('/api/auth/signin', {
      email,
      password,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Onboarding API calls
export const onboardAPI = {
  submitProfile: async (data: {
    weight: number;
    height: number;
    gender: string;
    dob?: string;
  }) => {
    const response = await api.post('/api/onboard', data);
    return response.data;
  },

  submitLimitRating: async (limitRating: number) => {
    const response = await api.post('/api/onboard/limit-rating', {
      limitRating,
    });
    return response.data;
  },

  setupHydration: async (data: {
    wakeTime: string;
    sleepTime: string;
    activityLevel: 'Sedentary' | 'Moderate' | 'Active';
  }) => {
    const response = await api.post('/api/hydration/setup', data);
    return response.data;
  },
};

// Profile API calls
export const profileAPI = {
  getBMI: async () => {
    const response = await api.get('/api/services/profile/getBMI');
    return response.data;
  },
};

// Workout API calls (MongoDB Persistence)
export const workoutAPI = {
  saveWorkout: async (workout: WorkoutSummary) => {
    const response = await api.post('/api/workouts', workout);
    return response.data;
  },

  getWorkouts: async (params?: { limit?: number; page?: number }) => {
    const response = await api.get('/api/workouts', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/workouts/stats');
    return response.data;
  },

  getWorkoutById: async (id: string) => {
    const response = await api.get(`/api/workouts/${id}`);
    return response.data;
  },

  deleteWorkout: async (id: string) => {
    const response = await api.delete(`/api/workouts/${id}`);
    return response.data;
  },
};

// Road Network & Safety Routing API calls
export const roadsAPI = {
  getSegments: async (params?: {
    areaKey?: string;
    mode?: 'walking' | 'running' | 'cycling';
    format?: 'geojson' | 'json';
  }) => {
    const response = await api.get('/api/roads/segments', { params });
    return response.data;
  },

  getLoopRoute: async (params: {
    lat: number;
    lng: number;
    distanceKm: number;
    mode?: 'walking' | 'running' | 'cycling';
    areaKey?: string;
    tolerance?: number;
  }) => {
    const response = await api.get('/api/roads/loop', { params });
    return response.data;
  },

  updateTraffic: async (
    segmentId: string,
    data: {
      currentLevel: number;
      source?: string;
      confidence?: number;
      currentSpeedKph?: number;
      freeFlowSpeedKph?: number;
      roadClosure?: boolean;
    }
  ) => {
    const response = await api.patch(`/api/roads/segments/${segmentId}/traffic`, data);
    return response.data;
  },
};

export default api;
