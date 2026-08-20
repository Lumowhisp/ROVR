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

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until navigation is ready AND auth is loaded
    if (isLoading) return;
    if (!navigationState?.key) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const inOnboardingGroup = firstSegment === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in' as any);
      }
    } else {
      // User is authenticated
      if (user?.isOnboarded) {
        // User has already completed onboarding
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/(tabs)' as any);
        }
      } else {
        // User has not completed onboarding
        if (inAuthGroup || firstSegment === '(tabs)' || !firstSegment) {
          router.replace('/(onboarding)/gender' as any);
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key, router, user?.isOnboarded]);

  if (isLoading || !navigationState?.key) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#98E527" />
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
    backgroundColor: '#08080C',
  },
});