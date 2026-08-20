import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Line, Polygon, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ProgressRing } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { stepsAPI } from '@/services/api';
import { workoutStorage } from '@/services/workoutStorage';
import * as Haptics from 'expo-haptics';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface MetricItem {
  label: string;
  value: string;
}

interface RecordItem {
  label: string;
  value: string;
  icon: string;
}

export default function ProgressScreen() {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [totalDistance, setTotalDistance] = useState('0 km');
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [streakPct, setStreakPct] = useState(0);

  const loadData = useCallback(async (selectedPeriod: 'Week' | 'Month' | 'Year') => {
    try {
      setLoading(true);

      // Try backend first, fallback to local
      let distData: number[] = [0, 0, 0, 0, 0, 0, 0];
      let totalDist = 0;
      let totalCal = 0;
      let activeMinutes = 0;
      let workoutCount = 0;

      if (selectedPeriod === 'Week') {
        try {
          const weeklyRes = await stepsAPI.getWeekly();
          if (weeklyRes?.data) {
            const d = weeklyRes.data;
            distData = d.dailyDistances ?? d.daily_distances ?? distData;
            totalDist = d.totalDistance ?? d.total_distance_km ?? 0;
            totalCal = d.totalCalories ?? d.total_calories ?? 0;
            activeMinutes = d.totalActiveMinutes ?? d.total_active_minutes ?? 0;
            workoutCount = d.totalDays ?? d.activeDays ?? 0;
          }
        } catch {
          // Fallback to local workout data
          const workouts = await workoutStorage.getAllWorkouts();
          const now = Date.now();
          const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
          const weekWorkouts = workouts.filter((w) => w.startTime >= weekAgo);

          // Build daily distances for the chart
          const dailyMap = new Map<number, number>();
          for (const w of weekWorkouts) {
            const day = new Date(w.startTime).getDay();
            dailyMap.set(day, (dailyMap.get(day) || 0) + w.distanceKm);
          }
          // Mon=0, Tue=1, ... Sun=6 → JS getDay(): Sun=0, Mon=1...
          const reorderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun
          distData = reorderedDays.map((d) => Number((dailyMap.get(d) || 0).toFixed(1)));
          totalDist = weekWorkouts.reduce((s, w) => s + w.distanceKm, 0);
          totalCal = weekWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
          activeMinutes = Math.round(weekWorkouts.reduce((s, w) => s + w.durationSeconds, 0) / 60);
          workoutCount = weekWorkouts.length;
        }
      } else if (selectedPeriod === 'Month') {
        try {
          const monthlyRes = await stepsAPI.getMonthly();
          if (monthlyRes?.data) {
            const d = monthlyRes.data;
            totalDist = d.totalDistance ?? d.total_distance_km ?? 0;
            totalCal = d.totalCalories ?? d.total_calories ?? 0;
            activeMinutes = d.totalActiveMinutes ?? d.total_active_minutes ?? 0;
            workoutCount = d.totalDays ?? d.activeDays ?? 0;
            // Use weekly breakdown for chart if available
            distData = d.weeklyDistances ?? distData;
          }
        } catch {
          const workouts = await workoutStorage.getAllWorkouts();
          const now = Date.now();
          const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
          const monthWorkouts = workouts.filter((w) => w.startTime >= monthAgo);
          totalDist = monthWorkouts.reduce((s, w) => s + w.distanceKm, 0);
          totalCal = monthWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
          activeMinutes = Math.round(monthWorkouts.reduce((s, w) => s + w.durationSeconds, 0) / 60);
          workoutCount = monthWorkouts.length;
        }
      } else {
        try {
          const statsRes = await stepsAPI.getStats();
          if (statsRes?.data) {
            const d = statsRes.data;
            totalDist = d.totalDistance ?? d.total_distance_km ?? 0;
            totalCal = d.totalCalories ?? d.total_calories ?? 0;
            activeMinutes = d.totalActiveMinutes ?? d.total_active_minutes ?? 0;
            workoutCount = d.totalDays ?? d.totalActivities ?? 0;
          }
        } catch {
          const stats = await workoutStorage.getCumulativeStats();
          totalDist = stats.totalDistanceKm;
          totalCal = stats.totalCaloriesBurned;
          activeMinutes = Math.round(stats.totalDurationSeconds / 60);
          workoutCount = stats.totalWorkouts;
        }
      }

      setChartData(distData);
      setTotalDistance(`${totalDist.toFixed(1)} km`);

      const h = Math.floor(activeMinutes / 60);
      const m = activeMinutes % 60;
      setMetrics([
        { label: 'DISTANCE', value: `${totalDist.toFixed(1)} km` },
        { label: 'CALORIES', value: totalCal.toLocaleString() },
        { label: 'ACTIVE TIME', value: `${h}h ${m}m` },
        { label: 'WORKOUTS', value: `${workoutCount}` },
      ]);

      // Records — try from backend
      try {
        const statsRes = await stepsAPI.getStats();
        if (statsRes?.data?.personalBests) {
          const pb = statsRes.data.personalBests;
          setRecords([
            { label: '5K', value: pb.best5k ?? '--', icon: '🏃' },
            { label: '10K', value: pb.best10k ?? '--', icon: '🏁' },
            { label: 'Longest Run', value: pb.longestRun ? `${pb.longestRun} km` : '--', icon: '📍' },
          ]);
        } else {
          // Fallback — compute from local workouts
          const workouts = await workoutStorage.getAllWorkouts();
          const runs = workouts.filter((w) => w.activityType === 'running');
          const longest = runs.reduce((max, w) => Math.max(max, w.distanceKm), 0);
          setRecords([
            { label: 'Longest Run', value: longest > 0 ? `${longest.toFixed(1)} km` : '--', icon: '📍' },
            { label: 'Total Sessions', value: `${workouts.length}`, icon: '🏁' },
            { label: 'Total XP', value: `${workouts.reduce((s, w) => s + w.earnedXP, 0)}`, icon: '⚡' },
          ]);
        }
      } catch {
        const workouts = await workoutStorage.getAllWorkouts();
        const longest = workouts.reduce((max, w) => Math.max(max, w.distanceKm), 0);
        setRecords([
          { label: 'Longest Run', value: longest > 0 ? `${longest.toFixed(1)} km` : '--', icon: '📍' },
          { label: 'Total Sessions', value: `${workouts.length}`, icon: '🏁' },
          { label: 'Total XP', value: `${workouts.reduce((s, w) => s + w.earnedXP, 0)}`, icon: '⚡' },
        ]);
      }

      // Streak
      try {
        const streakRes = await stepsAPI.getStreak();
        if (streakRes?.data) {
          const current = streakRes.data.currentStreak ?? streakRes.data.current ?? 0;
          const longest = streakRes.data.longestStreak ?? streakRes.data.longest ?? 10;
          setStreakDays(current);
          setStreakPct(longest > 0 ? Math.min(Math.round((current / longest) * 100), 100) : 0);
        }
      } catch {
        setStreakDays(0);
        setStreakPct(0);
      }
    } catch (err) {
      console.log('Progress load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(period);
    }, [loadData, period])
  );

  const handleSelectPeriod = (p: 'Week' | 'Month' | 'Year') => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setPeriod(p);
  };

  const maxVal = Math.max(...chartData, 0.1);
  const ptsList = chartData.map((v, i) => {
    const x = 24 + (i / Math.max(chartData.length - 1, 1)) * 272;
    const y = 96 - (v / maxVal) * 76;
    return [x, y] as [number, number];
  });
  const pts = ptsList.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleWrap}>
            {(['Week', 'Month', 'Year'] as const).map((p) => {
              const isSel = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.85}
                  onPress={() => handleSelectPeriod(p)}
                  style={[styles.toggleBtn, isSel && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, isSel && styles.toggleBtnTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#9BEA20" style={{ flex: 1 }} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Chart Card */}
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>TOTAL DISTANCE</Text>
              <Text style={styles.chartNumber}>{totalDistance}</Text>

              <View style={styles.svgWrap}>
                <Svg width="100%" height={120} viewBox="0 0 320 120">
                  <Defs>
                    <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#9BEA20" stopOpacity="0.3" />
                      <Stop offset="1" stopColor="#9BEA20" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>

                  {/* Grid Lines */}
                  {[24, 50, 76].map((y) => (
                    <Line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="320"
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Area Fill */}
                  <Polygon points={`24,96 ${pts} 296,96`} fill="url(#chartGrad)" />

                  {/* Line Spline */}
                  <Polyline
                    points={pts}
                    fill="none"
                    stroke="#9BEA20"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {ptsList.map(([x, y], i) =>
                    chartData[i] > 0 ? (
                      <Circle key={i} cx={x} cy={y} r={4} fill="#9BEA20" />
                    ) : null
                  )}

                  {/* Day Labels */}
                  {(period === 'Week' ? DAYS : chartData.map((_, i) => `W${i + 1}`)).map((d, i) => (
                    <SvgText
                      key={d + i}
                      x={24 + (i / Math.max(chartData.length - 1, 1)) * 272}
                      y={114}
                      textAnchor="middle"
                      fontSize={10}
                      fill="rgba(255, 255, 255, 0.35)"
                      fontWeight="600"
                    >
                      {d}
                    </SvgText>
                  ))}
                </Svg>
              </View>
            </View>

            {/* Metric Grid 2x2 */}
            <View style={styles.grid}>
              {metrics.map((m) => (
                <View key={m.label} style={styles.metricCard}>
                  <Text style={styles.gridLbl}>{m.label}</Text>
                  <Text style={styles.gridVal}>{m.value}</Text>
                </View>
              ))}
            </View>

            {/* Personal Records */}
            <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
            <View style={styles.recordsList}>
              {records.map((r) => (
                <View key={r.label} style={styles.recordItem}>
                  <Text style={styles.recordIcon}>{r.icon}</Text>
                  <Text style={styles.recordLabel}>{r.label}</Text>
                  <Text style={styles.recordValue}>{r.value}</Text>
                </View>
              ))}
            </View>

            {/* Streak Card */}
            <View style={styles.streakCard}>
              <ProgressRing
                size={60}
                stroke={4.5}
                progress={streakPct}
                color="#9BEA20"
                trackColor="rgba(255, 255, 255, 0.08)"
              >
                <Text style={styles.streakNumber}>{streakDays}</Text>
              </ProgressRing>

              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>{streakDays} Day Streak 🔥</Text>
                <Text style={styles.streakSub}>
                  {streakDays > 0 ? "You're on fire. Keep going!" : 'Start a streak today!'}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        <BottomNav active="progress" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25272A',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F7F8F9',
    letterSpacing: -0.5,
  },
  toggleRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toggleWrap: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  toggleBtnActive: {
    backgroundColor: '#F7F8F9',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  toggleBtnTextActive: {
    color: '#111214',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  chartCard: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
  },
  chartNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F7F8F9',
    marginTop: 2,
    marginBottom: 8,
  },
  svgWrap: {
    width: '100%',
    height: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.3%',
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gridLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  gridVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F7F8F9',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  recordsList: {
    gap: 8,
    marginBottom: 18,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  recordIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recordLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F7F8F9',
  },
  recordValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9BEA20',
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
