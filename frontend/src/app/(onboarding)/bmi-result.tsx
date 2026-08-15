import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { profileAPI } from "@/services/api";

const { width } = Dimensions.get("window");

export default function BMIResultScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ bmi: string }>();
  const [bmiValue, setBmiValue] = useState<number>(
    params.bmi ? parseFloat(params.bmi) : user?.bmi || 22.5
  );

  const scaleVal = useSharedValue(0.8);
  const opacityVal = useSharedValue(0);

  useEffect(() => {
    scaleVal.value = withSpring(1, { damping: 12 });
    opacityVal.value = withTiming(1, { duration: 600 });

    if (!params.bmi && !user?.bmi) {
      profileAPI.getBMI().then((res) => {
        if (res?.bmi) {
          setBmiValue(res.bmi);
        }
      }).catch(() => {});
    }
  }, [params.bmi, user?.bmi]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
    opacity: opacityVal.value,
  }));

  const getBMICategory = (val: number) => {
    if (val < 18.5) return { category: "Underweight", color: "#38BDF8", desc: "Slightly below standard range" };
    if (val < 25) return { category: "Normal Weight", color: "#4ADE80", desc: "Healthy, optimal BMI range" };
    if (val < 30) return { category: "Overweight", color: "#FACC15", desc: "Slightly above standard range" };
    return { category: "Obese", color: "#F87171", desc: "Higher risk health category" };
  };

  const bmiInfo = getBMICategory(bmiValue);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0F", "#11111E", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <Text style={styles.title}>Your Body Mass Index</Text>
        <Text style={styles.subtitle}>Calculated from your personal stats</Text>
      </Animated.View>

      <Animated.View style={[styles.card, animStyle]}>
        <View style={[styles.circleRing, { borderColor: bmiInfo.color }]}>
          <Text style={styles.bmiValueText}>{bmiValue.toFixed(1)}</Text>
          <Text style={styles.bmiUnitText}>BMI</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: `${bmiInfo.color}20`, borderColor: bmiInfo.color }]}>
          <Text style={[styles.badgeText, { color: bmiInfo.color }]}>
            {bmiInfo.category}
          </Text>
        </View>

        <Text style={styles.descriptionText}>{bmiInfo.desc}</Text>

        <View style={styles.scaleContainer}>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleSection, { backgroundColor: "#38BDF8" }]} />
            <View style={[styles.scaleSection, { backgroundColor: "#4ADE80" }]} />
            <View style={[styles.scaleSection, { backgroundColor: "#FACC15" }]} />
            <View style={[styles.scaleSection, { backgroundColor: "#F87171" }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabelText}>18.5</Text>
            <Text style={styles.scaleLabelText}>25.0</Text>
            <Text style={styles.scaleLabelText}>30.0</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
        <Pressable
          style={styles.continueBtn}
          onPress={() => router.push("/(onboarding)/rate-limit" as any)}
        >
          <LinearGradient
            colors={["#6C63FF", "#4ADE80"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.continueText}>Continue to Rate Limit</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
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
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#161622",
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  circleRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 20,
  },
  bmiValueText: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  bmiUnitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 24,
  },
  scaleContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  scaleBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 8,
  },
  scaleSection: {
    flex: 1,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  scaleLabelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  footer: {
    width: "100%",
  },
  continueBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
