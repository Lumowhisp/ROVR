import { Stack } from "expo-router";
import { useFonts } from "expo-font";

import {
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import "../../global.css";

export default function RootLayout() {
  const [loaded] = useFonts({
    PlayfairBold: PlayfairDisplay_700Bold,

    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });

  if (!loaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
