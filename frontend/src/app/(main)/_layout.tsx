import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#25272A' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="activity-feed" />
      <Stack.Screen name="activity-history" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="hydration" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
