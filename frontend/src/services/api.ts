import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const RENDER_BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rovr.onrender.com';

// Automatically detect host IP in local dev or fallback to live Render backend
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  // Only use local dev server if not in tunnel / cloud mode
  if (hostUri && !hostUri.includes('ngrok') && !hostUri.includes('expo.dev')) {
    const ip = hostUri.split(':')[0];
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return `http://${ip}:3000`;
    }
  }

  return RENDER_BACKEND_URL;
};

const BASE_URL = getBaseUrl();

// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
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

// Steps & Activity API calls (MongoDB backend on main)
export const stepsAPI = {
  syncSteps: async (data: { date: string; steps: number; active_minutes?: number }) => {
    const response = await api.post('/api/services/steps/sync', data);
    return response.data;
  },

  getToday: async (date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get('/api/services/steps/today', { params });
    return response.data;
  },

  getHistory: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/api/services/steps/history', { params });
    return response.data;
  },

  getWeekly: async () => {
    const response = await api.get('/api/services/steps/weekly');
    return response.data;
  },

  getMonthly: async () => {
    const response = await api.get('/api/services/steps/monthly');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/services/steps/stats');
    return response.data;
  },

  getStreak: async () => {
    const response = await api.get('/api/services/steps/streak');
    return response.data;
  },

  getGoal: async () => {
    const response = await api.get('/api/services/steps/goal');
    return response.data;
  },

  updateGoal: async (goal: number) => {
    const response = await api.put('/api/services/steps/goal', { goal });
    return response.data;
  },
};

// Hydration API calls
export const hydrationAPI = {
  createDaily: async () => {
    const response = await api.post('/api/hydration/daily');
    return response.data;
  },

  setup: async (data: {
    wakeTime: string;
    sleepTime: string;
    activityLevel: 'Sedentary' | 'Moderate' | 'Active';
  }) => {
    const response = await api.post('/api/hydration/setup', data);
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
