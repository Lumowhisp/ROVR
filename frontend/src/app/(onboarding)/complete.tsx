import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { CheckCircle2, Sparkles, Flame, Droplet, ArrowRight } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, [scale]);

  const badgeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0F", "#150A21", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={styles.orbTop} />

      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, badgeAnim]}>
          <LinearGradient
            colors={["#A855F7", "#6366F1", "#06B6D4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <CheckCircle2 size={54} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.textWrap}>
          <View style={styles.tag}>
            <Sparkles size={14} color="#A855F7" />
            <Text style={styles.tagText}>Profile Ready</Text>
          </View>
          <Text style={styles.title}>You&apos;re All Set,{"\n"}{user?.name || "Athlete"}!</Text>
          <Text style={styles.subtitle}>
            Your personalized metrics, limit threshold, and hydration roadmap have been generated.
          </Text>
        </Animated.View>

        {/* Stats summary preview card */}
        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.summaryCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
              <Flame size={20} color="#A855F7" />
            </View>
            <Text style={styles.statVal}>{user?.bmi ? user.bmi.toFixed(1) : "22.5"}</Text>
            <Text style={styles.statLabel}>BMI Index</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(74, 222, 128, 0.15)" }]}>
              <Sparkles size={20} color="#4ADE80" />
            </View>
            <Text style={styles.statVal}>{user?.limitRating || 4}/10</Text>
            <Text style={styles.statLabel}>Limit Rating</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
              <Droplet size={20} color="#38BDF8" />
            </View>
            <Text style={styles.statVal}>Active</Text>
            <Text style={styles.statLabel}>Hydration</Text>
          </View>
        </Animated.View>
      </View>

      {/* Action button */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.footer}>
        <Pressable
          style={styles.startBtn}
          onPress={() => {
            router.replace("/(tracker)/workout" as any);
          }}
        >
          <LinearGradient
            colors={["#98E527", "#4ADE80"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={[styles.btnText, { color: "#000000" }]}>Start Workout & Tracking</Text>
            <ArrowRight size={20} color="#000000" strokeWidth={2.5} />
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
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  orbTop: {
    position: "absolute",
    top: -100,
    left: "25%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  content: {
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 24,
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A855F7",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  summaryCard: {
    marginTop: 40,
    width: "100%",
    backgroundColor: "#11111B",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E1E2E",
    paddingVertical: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 2,
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#1E1E2E",
  },
  footer: {
    width: "100%",
  },
  startBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
