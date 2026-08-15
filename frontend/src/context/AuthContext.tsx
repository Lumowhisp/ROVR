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

const TOKEN_KEY = 'rovr_token';
const USER_KEY = 'rovr_user';

interface User {
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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Hydrate auth state from storage on app load
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setState({
            token: storedToken,
            user: JSON.parse(storedUser),
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await authAPI.signIn(email, password);
    const { token, user: userData } = data;

    const user: User = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      isBMI: userData.isBMI,
      isOnboarded: userData.isOnboarded,
      bmi: userData.bmi,
      limitRating: userData.limitRating,
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
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authAPI.signUp(name, email, password);
      const { token, user: userData } = data;

      const user: User = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        isBMI: userData.isBMI,
        isOnboarded: userData.isOnboarded,
        bmi: userData.bmi,
        limitRating: userData.limitRating,
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
    },
    []
  );

  const signOut = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);

    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...userData };
      // Persist updated user to storage (fire-and-forget)
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
    }),
    [state, signIn, signUp, signOut, updateUser]
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
