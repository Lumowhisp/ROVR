import { Stack } from 'expo-router';

export default function TrackerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#25272A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="workout" options={{ headerShown: false }} />
      <Stack.Screen name="tracking" options={{ headerShown: false }} />
      <Stack.Screen name="workout-summary" options={{ headerShown: false }} />
      <Stack.Screen name="gps_test" options={{ headerShown: false }} />
    </Stack>
  );
}
