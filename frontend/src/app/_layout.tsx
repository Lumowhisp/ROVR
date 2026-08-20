import { useEffect } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Slot,
  useRouter,
  useSegments,
  useRootNavigationState,
} from 'expo-router';
import { useColorScheme, ActivityIndicator, View, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StepProvider } from '@/context/StepContext';
import { GestureHandlerRootView } from "react-native-gesture-handler";

// SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until navigation is ready AND auth is loaded
    if (isLoading) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!inAuthGroup && !isAuthenticated) {
      router.replace('/(auth)/sign-in' as any);
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key, router, user]);

  if (isLoading || !navigationState?.key) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <StepProvider>
            <RootNavigator />
          </StepProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
});