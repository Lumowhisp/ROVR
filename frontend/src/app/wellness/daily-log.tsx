import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { NotebookPen, ChevronRight } from "lucide-react-native";
import { wellnessAPI, FlowLevel, Symptom } from "@/services/wellnessApi";

const ACCENT = "#EC4899";

const FLOW_OPTIONS: FlowLevel[] = ["NONE", "SPOTTING", "LIGHT", "MEDIUM", "HEAVY"];
const SYMPTOM_OPTIONS: Symptom[] = [
    "CRAMPS",
    "HEADACHE",
    "FATIGUE",
    "BLOATING",
    "ACNE",
    "BACK_PAIN",
    "BREAST_TENDERNESS",
];
const MOOD_CATEGORIES: {
    key: "mood" | "energy" | "stress" | "sleepQuality" | "motivation";
    label: string;
}[] = [
        { key: "mood", label: "Mood" },
        { key: "energy", label: "Energy" },
        { key: "stress", label: "Stress" },
        { key: "sleepQuality", label: "Sleep Quality" },
        { key: "motivation", label: "Motivation" },
    ];

function toDateString(date: Date) {
    return date.toISOString().split("T")[0];
}

export default function DailyLogScreen() {
    const router = useRouter();
    const [flow, setFlow] = useState<FlowLevel>("NONE");
    const [painLevel, setPainLevel] = useState(0);
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [mood, setMood] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const toggleSymptom = (s: Symptom) => {
        setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await wellnessAPI.saveDailyLog({
                date: toDateString(new Date()),
                flow,
                painLevel,
                symptoms,
                mood,
                notes,
            });
            router.back();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to save daily log.";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#0A0A0F", "#1A0A14", "#0A0A0F"]} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
                    <View style={styles.iconCircle}>
                        <NotebookPen size={26} color={ACCENT} />
                    </View>
                    <Text style={styles.title}>Today&apos;s Check-In</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.card}>
                    <Text style={styles.label}>Flow</Text>
                    <View style={styles.pillRow}>
                        {FLOW_OPTIONS.map((opt) => (
                            <Pressable
                                key={opt}
                                style={[styles.pill, flow === opt && styles.pillActive]}
                                onPress={() => setFlow(opt)}
                            >
                                <Text style={[styles.pillText, flow === opt && styles.pillTextActive]}>{opt}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>
                    <Text style={styles.label}>Pain Level: {painLevel}</Text>
                    <View style={styles.pillRow}>
                        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                            <Pressable
                                key={n}
                                style={[styles.numChip, painLevel === n && styles.pillActive]}
                                onPress={() => setPainLevel(n)}
                            >
                                <Text style={[styles.pillText, painLevel === n && styles.pillTextActive]}>{n}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
                    <Text style={styles.label}>Symptoms</Text>
                    <View style={styles.pillRow}>
                        {SYMPTOM_OPTIONS.map((s) => (
                            <Pressable
                                key={s}
                                style={[styles.pill, symptoms.includes(s) && styles.pillActive]}
                                onPress={() => toggleSymptom(s)}
                            >
                                <Text style={[styles.pillText, symptoms.includes(s) && styles.pillTextActive]}>
                                    {s.replace("_", " ")}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.card}>
                    <Text style={styles.label}>How are you feeling?</Text>
                    {MOOD_CATEGORIES.map((cat) => (
                        <View key={cat.key} style={styles.moodRow}>
                            <Text style={styles.moodLabel}>{cat.label}</Text>
                            <View style={styles.pillRow}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Pressable
                                        key={n}
                                        style={[styles.numChip, mood[cat.key] === n && styles.pillActive]}
                                        onPress={() => setMood((prev) => ({ ...prev, [cat.key]: n }))}
                                    >
                                        <Text style={[styles.pillText, mood[cat.key] === n && styles.pillTextActive]}>
                                            {n}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.card}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Anything else worth noting today..."
                        placeholderTextColor="#6B7280"
                        multiline
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(350).duration(500)}>
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
                                    <Text style={styles.submitBtnText}>Save Today&apos;s Log</Text>
                                    <ChevronRight size={18} color="#FFFFFF" />
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
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },
    header: { alignItems: "center", marginBottom: 20 },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(236,72,153,0.12)",
        borderWidth: 1.5,
        borderColor: "rgba(236,72,153,0.3)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
    card: {
        backgroundColor: "#11111A",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#1E1E2E",
        padding: 16,
        marginBottom: 14,
    },
    label: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 10 },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 14,
        backgroundColor: "#0A0A10",
        borderWidth: 1,
        borderColor: "#27273A",
    },
    numChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A0A10",
        borderWidth: 1,
        borderColor: "#27273A",
    },
    pillActive: { backgroundColor: "rgba(236,72,153,0.15)", borderColor: ACCENT },
    pillText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },
    pillTextActive: { color: ACCENT },
    moodRow: { marginBottom: 14 },
    moodLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 8 },
    notesInput: {
        backgroundColor: "#0A0A10",
        borderWidth: 1,
        borderColor: "#27273A",
        borderRadius: 14,
        padding: 12,
        color: "#FFFFFF",
        minHeight: 80,
        textAlignVertical: "top",
    },
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
