import { Stack } from "expo-router";

export default function WellnessLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#0A0A0F" },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="log-cycle" />
            <Stack.Screen name="daily-log" />
        </Stack>
    );
}
