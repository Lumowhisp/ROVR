import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically detect host IP from Expo manifest (works on Mobile Hotspot, Wi-Fi, etc.)
const getBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.50.74.37:3000';
};

const BASE_URL = getBaseUrl();

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

export default api;
