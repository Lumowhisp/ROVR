import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import LottieView from "lottie-react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Minus, Plus, ChevronRight } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const BG = "#2A1810";
const CIRCLE_BG = "#7A3B2E";
const CREAM = "#F5E9D9";
const ACCENT = "#8B6BA8"; // muted purple, echoes the ribcage tone
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 220;

export default function HeightSelector() {
  const [heightCm, setHeightCm] = useState(162);
  const bump = useSharedValue(1);
  const router = useRouter();
  const { gender, dob } = useLocalSearchParams<{ gender: string; dob: string }>();

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  const pulse = () => {
    bump.set(
      withSpring(1.15, { damping: 8 }, () => {
        bump.set(withSpring(1));
      })
    );
  };

  const adjust = (delta: number) => {
    setHeightCm((prev) =>
      Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, prev + delta))
    );
    pulse();
  };

  const handleContinue = () => {
    router.push({
      pathname: "/(onboarding)/WeightScreen/Weight",
      params: {
        gender: gender || "",
        dob: dob || "",
        height: heightCm.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How tall are you?</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your plan
        </Text>
      </View>

      {/* Lottie in warm circle badge, matching reference */}
      <View style={styles.badgeWrap}>
        <View style={styles.circleBg} />
        <LottieView
          source={require("../../../../assets/GenderScreenAssets/MeditationSkull.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Stepper */}
      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => adjust(-1)}
          hitSlop={12}
        >
          <Minus size={22} color={CREAM} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.numberWrap}>
          <Animated.Text style={[styles.numberText, numberStyle]}>
            {heightCm}
          </Animated.Text>
          <Text style={styles.unitText}>cm</Text>
        </View>

        <Pressable
          style={styles.stepBtn}
          onPress={() => adjust(1)}
          hitSlop={12}
        >
          <Plus size={22} color={CREAM} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* CTA */}
      <Pressable style={styles.ctaButton} onPress={handleContinue}>
        <Text style={styles.ctaText}>Continue</Text>
        <View style={styles.ctaIconWrap}>
          <ChevronRight size={18} color={BG} strokeWidth={2.5} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: CREAM,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(245,233,217,0.55)",
    marginTop: 8,
    textAlign: "center",
  },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleBg: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: CIRCLE_BG,
  },
  lottie: {
    width: 240,
    height: 240,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(245,233,217,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(245,233,217,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  numberWrap: {
    alignItems: "center",
    minWidth: 110,
  },
  numberText: {
    fontSize: 56,
    fontWeight: "800",
    color: CREAM,
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 14,
    color: "rgba(245,233,217,0.5)",
    marginTop: -4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: ACCENT,
    borderRadius: 40,
    paddingVertical: 18,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: CREAM,
  },
  ctaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
});