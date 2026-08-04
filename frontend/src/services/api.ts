import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically detect host IP from Expo manifest (works on Mobile Hotspot, Wi-Fi, etc.)
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.57.101.37:3000';
};

const BASE_URL = getBaseUrl();

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

export default api;
