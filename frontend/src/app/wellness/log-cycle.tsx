import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, ChevronRight } from "lucide-react-native";
import { wellnessAPI } from "@/services/wellnessApi";

const ACCENT = "#EC4899";

function toDateString(date: Date) {
    return date.toISOString().split("T")[0];
}

export default function LogCycleScreen() {
    const router = useRouter();
    const [cycleStart, setCycleStart] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [periodLength, setPeriodLength] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await wellnessAPI.logCycle({
                cycleStart: toDateString(cycleStart),
                periodLength: periodLength ?? undefined,
            });
            router.back();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to log cycle.";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#0A0A0F", "#1A0A14", "#0A0A0F"]} style={StyleSheet.absoluteFill} />

            <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
                <View style={styles.iconCircle}>
                    <CalendarDays size={28} color={ACCENT} />
                </View>
                <Text style={styles.title}>Log Your Period</Text>
                <Text style={styles.subtitle}>When did your most recent period start?</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>
                <Text style={styles.label}>Period Start Date</Text>
                <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
                    <Text style={styles.dateBtnText}>{cycleStart.toDateString()}</Text>
                </Pressable>
                {showPicker && (
                    <DateTimePicker
                        value={cycleStart}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowPicker(Platform.OS === "ios");
                            if (selectedDate) setCycleStart(selectedDate);
                        }}
                    />
                )}

                <Text style={[styles.label, { marginTop: 20 }]}>Period Length (optional)</Text>
                <View style={styles.pillRow}>
                    {[3, 4, 5, 6, 7, 8].map((n) => (
                        <Pressable
                            key={n}
                            style={[styles.pill, periodLength === n && styles.pillActive]}
                            onPress={() => setPeriodLength(periodLength === n ? null : n)}
                        >
                            <Text style={[styles.pillText, periodLength === n && styles.pillTextActive]}>
                                {n}d
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
                <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                    <LinearGradient
                        colors={[ACCENT, "#A855F7"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.btnGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Save</Text>
                                <ChevronRight size={18} color="#FFFFFF" />
                            </>
                        )}
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
        paddingTop: 70,
        paddingBottom: 40,
        justifyContent: "space-between",
    },
    header: { alignItems: "center", marginBottom: 20 },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(236,72,153,0.12)",
        borderWidth: 1.5,
        borderColor: "rgba(236,72,153,0.3)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6, textAlign: "center" },
    card: {
        backgroundColor: "#11111A",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#1E1E2E",
        padding: 20,
    },
    label: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 10 },
    dateBtn: {
        backgroundColor: "#0A0A10",
        borderWidth: 1,
        borderColor: "#27273A",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    dateBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "#0A0A10",
        borderWidth: 1,
        borderColor: "#27273A",
    },
    pillActive: { backgroundColor: "rgba(236,72,153,0.15)", borderColor: ACCENT },
    pillText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },
    pillTextActive: { color: ACCENT },
    footer: {},
    submitBtn: { borderRadius: 18, overflow: "hidden" },
    btnGradient: {
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
