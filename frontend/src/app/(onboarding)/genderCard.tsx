import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import LottieView from "lottie-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";

const ACCENT = "#6C5CE7";
const { width } = Dimensions.get("window");
const TILE_WIDTH = (width - 24 * 2 - 14) / 2; // screen padding + gap

const genders = [
  {
    label: "Male",
    animation: require("../../../assets/GenderScreenAssets/Male.json"),
  },
  {
    label: "Female",
    animation: require("../../../assets/GenderScreenAssets/Female.json"),
  },
];

function GenderTile({
  gender,
  isSelected,
  onPress,
}: {
  gender: (typeof genders)[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const selectProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectProgress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selectProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected ? ACCENT : "rgba(255,255,255,0.08)",
    backgroundColor: isSelected
      ? "rgba(108,92,231,0.14)"
      : "rgba(255,255,255,0.04)",
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: selectProgress.value,
    transform: [{ scale: 0.6 + selectProgress.value * 0.4 }],
  }));

  return (
    <Pressable
      onPressIn={() => scale.set(withSpring(0.97, { damping: 15 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 15 }))}
      onPress={onPress}
      style={{ width: TILE_WIDTH }}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Check size={14} color="#fff" strokeWidth={3} />
        </Animated.View>

        <View style={styles.lottieWrap}>
          <LottieView
            source={gender.animation}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>

        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {gender.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GenderCard() {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>What&apos;s your gender?</Text>
        <Text style={styles.subtitle}>This helps us personalize your plan</Text>
      </View>

      <View style={styles.row}>
        {genders.map((gender) => (
          <GenderTile
            key={gender.label}
            gender={gender}
            isSelected={selectedGender === gender.label}
            onPress={() => setSelectedGender(gender.label)}
          />
        ))}
      </View>

      <Pressable
        disabled={!selectedGender}
        style={[styles.continueBtn, { opacity: selectedGender ? 1 : 0.35 }]}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: "space-between", // pushes title / cards / button to fill screen
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    aspectRatio: 0.85, // tall rounded rectangle, not a pill
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieWrap: {
    width: "80%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginTop: 12,
  },
  labelSelected: {
    color: "#FFFFFF",
  },
  continueBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
