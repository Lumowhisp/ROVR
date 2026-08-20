import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Line, Polygon, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ProgressRing } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import * as Haptics from 'expo-haptics';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_DATA = [5.2, 0, 8.8, 6.1, 0, 12.4, 9.7];

const METRICS = [
  { label: 'DISTANCE', value: '42.2 km' },
  { label: 'CALORIES', value: '2,840' },
  { label: 'ACTIVE TIME', value: '4h 21m' },
  { label: 'WORKOUTS', value: '6' },
];

const RECORDS = [
  { label: '5K', value: '24:31', icon: '🏃' },
  { label: '10K', value: '52:12', icon: '🏁' },
  { label: 'Longest Run', value: '15.4 km', icon: '📍' },
];

export default function ProgressScreen() {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Week');

  const maxVal = Math.max(...WEEK_DATA);
  const ptsList = WEEK_DATA.map((v, i) => {
    const x = 24 + (i / 6) * 272;
    const y = 96 - (v / maxVal) * 76;
    return [x, y] as [number, number];
  });
  const pts = ptsList.map(([x, y]) => `${x},${y}`).join(' ');

  const handleSelectPeriod = (p: 'Week' | 'Month' | 'Year') => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setPeriod(p);
  };

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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>TOTAL DISTANCE</Text>
            <Text style={styles.chartNumber}>42.2 km</Text>

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
                  WEEK_DATA[i] > 0 ? (
                    <Circle key={i} cx={x} cy={y} r={4} fill="#9BEA20" />
                  ) : null
                )}

                {/* Day Labels */}
                {DAYS.map((d, i) => (
                  <SvgText
                    key={d + i}
                    x={24 + (i / 6) * 272}
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
            {METRICS.map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <Text style={styles.gridLbl}>{m.label}</Text>
                <Text style={styles.gridVal}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* Personal Records */}
          <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          <View style={styles.recordsList}>
            {RECORDS.map((r) => (
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
              progress={70}
              color="#9BEA20"
              trackColor="rgba(255, 255, 255, 0.08)"
            >
              <Text style={styles.streakNumber}>7</Text>
            </ProgressRing>

            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>7 Day Streak 🔥</Text>
              <Text style={styles.streakSub}>You&apos;re on fire. Keep going!</Text>
            </View>
          </View>
        </ScrollView>

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
