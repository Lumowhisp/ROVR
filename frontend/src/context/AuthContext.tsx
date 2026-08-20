import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';
import { workoutStorage } from '@/services/workoutStorage';

const TOKEN_KEY = 'rovr_token';
const USER_KEY = 'rovr_user';

export interface User {
  _id: string;
  name: string;
  email: string;
  isBMI?: boolean;
  isOnboarded?: boolean;
  bmi?: number;
  weight?: number;
  height?: number;
  gender?: string;
  dob?: string;
  limitRating?: number;
  hydration?: {
    wakeTime?: string;
    sleepTime?: string;
    activityLevel?: 'Sedentary' | 'Moderate' | 'Active';
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const signOut = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
        workoutStorage.clearHistory(),
      ]);
    } catch (err) {
      console.log('Error during sign out storage cleanup:', err);
    }

    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      if (res && res.user) {
        const freshUser: User = res.user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setState((prev) => ({
          ...prev,
          user: freshUser,
          isAuthenticated: true,
        }));
        // Sync workouts from MongoDB across devices
        workoutStorage.syncFromCloud().catch(() => {});
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token is expired (>7 days) or invalid
        await signOut();
      }
    }
  }, [signOut]);

  // Hydrate auth state from storage on app load
  useEffect(() => {
    let isMounted = true;

    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setState({
              token: storedToken,
              user: parsedUser,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          // Validate token with server in background & pull latest profile & workouts
          try {
            const res = await authAPI.getMe();
            if (res && res.user && isMounted) {
              const freshUser: User = res.user;
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
              setState((prev) => ({
                ...prev,
                user: freshUser,
              }));
              workoutStorage.syncFromCloud().catch(() => {});
            }
          } catch (apiErr: any) {
            if (apiErr?.response?.status === 401) {
              // 7-day token expired -> trigger sign out
              if (isMounted) {
                await signOut();
              }
            }
          }
        } else {
          if (isMounted) {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } catch {
        if (isMounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    loadStoredAuth();

    return () => {
      isMounted = false;
    };
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await authAPI.signIn(email, password);
    const { token, user: userData } = data;

    const user: User = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      isBMI: userData.isBMI,
      isOnboarded: userData.isOnboarded,
      bmi: userData.bmi,
      weight: userData.weight,
      height: userData.height,
      gender: userData.gender,
      dob: userData.dob,
      limitRating: userData.limitRating,
      hydration: userData.hydration,
    };

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);

    setState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    // Populate all MongoDB workouts on this device immediately
    workoutStorage.syncFromCloud().catch(() => {});

    return user;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      const data = await authAPI.signUp(name, email, password);
      const { token, user: userData } = data;

      const user: User = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        isBMI: userData.isBMI,
        isOnboarded: userData.isOnboarded,
        bmi: userData.bmi,
        weight: userData.weight,
        height: userData.height,
        gender: userData.gender,
        dob: userData.dob,
        limitRating: userData.limitRating,
        hydration: userData.hydration,
      };

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      setState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    },
    []
  );

  const updateUser = useCallback(async (userData: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...userData };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      updateUser,
      refreshProfile,
    }),
    [state, signIn, signUp, signOut, updateUser, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
