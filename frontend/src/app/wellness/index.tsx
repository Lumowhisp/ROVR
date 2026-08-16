import { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Droplet, Utensils, Dumbbell, Plus, CalendarPlus } from "lucide-react-native";
import { wellnessAPI } from "@/services/wellnessApi";

const ACCENT = "#EC4899";

type CurrentCycleData = {
    cycle: { cycleStart: string };
    phase: { phase: string; cycleDay: number; isOverdue: boolean };
    prediction: {
        status: string;
        predictedNextPeriod: string | null;
        confidence: number | null;
    };
};

type Recommendations = {
    food: string;
    workout: string;
    hydration: string;
    general: string[];
    disclaimer: string;
};

export default function WellnessDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hasCycle, setHasCycle] = useState(true);
    const [current, setCurrent] = useState<CurrentCycleData | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendations | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await wellnessAPI.getCurrentCycle();
            setCurrent(res.data);
            setHasCycle(true);

            try {
                const recRes = await wellnessAPI.getRecommendations();
                setRecommendations(recRes.data.recommendations);
            } catch {
                setRecommendations(null);
            }
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                setHasCycle(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT} />
            </View>
        );
    }

    if (!hasCycle) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={["#0A0A0F", "#1A0A14", "#0A0A0F"]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Women&apos;s Wellness</Text>
                    <Text style={styles.emptySubtitle}>
                        Log your most recent period start date to begin tracking your cycle
                        and get phase-based recommendations.
                    </Text>
                    <Pressable
                        style={styles.primaryBtn}
                        onPress={() => router.push("/wellness/log-cycle" as any)}
                    >
                        <LinearGradient
                            colors={[ACCENT, "#A855F7"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <CalendarPlus size={20} color="#FFFFFF" />
                            <Text style={styles.primaryBtnText}>Log Your Cycle</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    }

    const phase = current?.phase.phase ?? "—";
    const cycleDay = current?.phase.cycleDay ?? 0;
    const predicted = current?.prediction.predictedNextPeriod
        ? new Date(current.prediction.predictedNextPeriod).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })
        : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <LinearGradient
                colors={["#0A0A0F", "#1A0A14", "#0A0A0F"]}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
                <Text style={styles.headerTitle}>Women&apos;s Wellness</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.phaseCard}>
                <View style={styles.phaseBadge}>
                    <Text style={styles.phaseBadgeText}>{phase}</Text>
                </View>
                <Text style={styles.cycleDayText}>Day {cycleDay}</Text>
                {predicted && (
                    <Text style={styles.predictionText}>
                        Next period expected around {predicted}
                        {current?.prediction.confidence != null
                            ? ` · ${Math.round(current.prediction.confidence * 100)}% confidence`
                            : ""}
                    </Text>
                )}
                {current?.phase.isOverdue && (
                    <Text style={styles.overdueText}>
                        Your period may be overdue — log it when it starts.
                    </Text>
                )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.actionsRow}>
                <Pressable
                    style={styles.actionBtn}
                    onPress={() => router.push("/wellness/daily-log" as any)}
                >
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Log Today</Text>
                </Pressable>
                <Pressable
                    style={styles.actionBtnSecondary}
                    onPress={() => router.push("/wellness/log-cycle" as any)}
                >
                    <CalendarPlus size={18} color={ACCENT} />
                    <Text style={styles.actionBtnSecondaryText}>New Period</Text>
                </Pressable>
            </Animated.View>

            {recommendations && (
                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.recSection}>
                    <Text style={styles.sectionTitle}>Today&apos;s Recommendations</Text>

                    <View style={styles.recCard}>
                        <Utensils size={18} color="#4ADE80" />
                        <Text style={styles.recText}>{recommendations.food}</Text>
                    </View>
                    <View style={styles.recCard}>
                        <Dumbbell size={18} color="#38BDF8" />
                        <Text style={styles.recText}>{recommendations.workout}</Text>
                    </View>
                    <View style={styles.recCard}>
                        <Droplet size={18} color="#818CF8" />
                        <Text style={styles.recText}>{recommendations.hydration}</Text>
                    </View>

                    {recommendations.general.map((note, i) => (
                        <Text key={i} style={styles.generalNote}>
                            • {note}
                        </Text>
                    ))}

                    <Text style={styles.disclaimer}>{recommendations.disclaimer}</Text>
                </Animated.View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0A0F" },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#0A0A0F",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    emptyTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginBottom: 12 },
    emptySubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 20,
    },
    primaryBtn: { borderRadius: 18, overflow: "hidden", width: "100%" },
    btnGradient: {
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    header: { marginBottom: 24 },
    headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
    phaseCard: {
        backgroundColor: "#161119",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(236,72,153,0.25)",
        padding: 20,
        marginBottom: 20,
    },
    phaseBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(236,72,153,0.15)",
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 10,
    },
    phaseBadgeText: { color: ACCENT, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
    cycleDayText: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginBottom: 6 },
    predictionText: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
    overdueText: { color: "#FACC15", fontSize: 13, marginTop: 6 },
    actionsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: ACCENT,
        borderRadius: 16,
        paddingVertical: 14,
    },
    actionBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
    actionBtnSecondary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "rgba(236,72,153,0.1)",
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: 16,
        paddingVertical: 14,
    },
    actionBtnSecondaryText: { color: ACCENT, fontSize: 14, fontWeight: "700" },
    recSection: { marginBottom: 20 },
    sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 12 },
    recCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#11111A",
        borderWidth: 1,
        borderColor: "#1E1E2E",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    recText: { flex: 1, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
    generalNote: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4, marginLeft: 4 },
    disclaimer: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 10, lineHeight: 15 },
});
