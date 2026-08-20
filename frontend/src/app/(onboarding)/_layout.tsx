import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0A0F' },
      }}
    >
      <Stack.Screen name="gender" />
      <Stack.Screen name="BirthdayScreen/BirthDay" />
      <Stack.Screen name="HeightScreen/heightCard" />
      <Stack.Screen name="WeightScreen/Weight" />
      <Stack.Screen name="bmi-result" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="activity-level" />
      <Stack.Screen name="hydration-setup" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}