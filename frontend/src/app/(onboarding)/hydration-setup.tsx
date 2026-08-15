import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Droplet, Sun, Moon, Zap, ChevronRight } from "lucide-react-native";
import { onboardAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function HydrationSetupScreen() {
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [activityLevel, setActivityLevel] = useState<"Sedentary" | "Moderate" | "Active">("Moderate");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { updateUser } = useAuth();

  const handleContinue = async () => {
    if (!wakeTime.trim() || !sleepTime.trim()) {
      Alert.alert("Input Error", "Please provide both wake and sleep times.");
      return;
    }

    setLoading(true);
    try {
      const res = await onboardAPI.setupHydration({
        wakeTime,
        sleepTime,
        activityLevel,
      });

      if (res.success) {
        await updateUser({
          isOnboarded: true,
        });
        router.push("/(onboarding)/complete" as any);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save hydration preferences.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const activityOptions: {
    level: "Sedentary" | "Moderate" | "Active";
    label: string;
    desc: string;
  }[] = [
    { level: "Sedentary", label: "Sedentary", desc: "Desk job, low daily movement" },
    { level: "Moderate", label: "Moderate", desc: "Walking, light workouts 3-4x/wk" },
    { level: "Active", label: "Active", desc: "Intense daily training or physical job" },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A0F", "#08101E", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.iconCircle}>
            <Droplet size={32} color="#38BDF8" />
          </View>
          <Text style={styles.title}>Hydration Plan</Text>
          <Text style={styles.subtitle}>
            Set your routine so ROVR can optimize your daily water targets
          </Text>
        </Animated.View>

        {/* Schedule Inputs */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>

          <View style={styles.timeRow}>
            <View style={styles.timeInputContainer}>
              <View style={styles.timeLabelWrap}>
                <Sun size={16} color="#FACC15" />
                <Text style={styles.timeLabel}>Wake Time</Text>
              </View>
              <TextInput
                style={styles.timeInput}
                value={wakeTime}
                onChangeText={setWakeTime}
                placeholder="07:00"
                placeholderTextColor="#6B7280"
                maxLength={5}
              />
            </View>

            <View style={styles.timeInputContainer}>
              <View style={styles.timeLabelWrap}>
                <Moon size={16} color="#818CF8" />
                <Text style={styles.timeLabel}>Sleep Time</Text>
              </View>
              <TextInput
                style={styles.timeInput}
                value={sleepTime}
                onChangeText={setSleepTime}
                placeholder="23:00"
                placeholderTextColor="#6B7280"
                maxLength={5}
              />
            </View>
          </View>
        </Animated.View>

        {/* Activity Level Selector */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Zap size={18} color="#38BDF8" />
            <Text style={styles.sectionTitle}>Activity Level</Text>
          </View>

          <View style={styles.optionsWrap}>
            {activityOptions.map((opt) => {
              const isSelected = activityLevel === opt.level;
              return (
                <Pressable
                  key={opt.level}
                  onPress={() => setActivityLevel(opt.level)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.footer}>
          <Pressable
            style={[styles.continueBtn, loading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={loading}
          >
            <LinearGradient
              colors={["#0284C7", "#38BDF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.continueText}>Complete Onboarding</Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={3} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 10,
  },
  sectionCard: {
    backgroundColor: "#11111A",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E1E2E",
    padding: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
    backgroundColor: "#0A0A10",
    borderWidth: 1,
    borderColor: "#27273A",
    borderRadius: 16,
    padding: 12,
  },
  timeLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  timeInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    paddingVertical: 4,
  },
  optionsWrap: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A10",
    borderWidth: 1.5,
    borderColor: "#222232",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#38BDF8",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  optionDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
  },
  continueBtn: {
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
  continueText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
