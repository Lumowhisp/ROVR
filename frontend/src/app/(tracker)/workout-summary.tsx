import React from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import Svg, { Rect, Polyline, Circle } from 'react-native-svg';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    distance?: string;
    duration?: string;
    calories?: string;
    pace?: string;
    speed?: string;
    xp?: string;
  }>();

  const distance = params.distance || '5.42';
  const duration = params.duration || '32:18';
  const calories = params.calories || '384';
  const pace = params.pace || "5'57\"";
  const speed = params.speed || '10.2';
  const xp = params.xp || '+86';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Workout Complete Badge */}
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Check size={14} color="#9BEA20" strokeWidth={3} />
              <Text style={styles.badgeText}>WORKOUT COMPLETE</Text>
            </View>
          </View>

          {/* Main Hero Metrics */}
          <View style={styles.mainMetricSection}>
            <Text style={styles.bigDistance}>{distance}</Text>
            <Text style={styles.unitText}>km</Text>
            <Text style={styles.durationText}>{duration}</Text>
          </View>

          {/* 4 Metric Grid */}
          <View style={styles.grid}>
            {[
              { label: 'PACE', value: `${pace}/km`, accent: false },
              { label: 'CALORIES', value: `${calories} kcal`, accent: false },
              { label: 'SPEED', value: `${speed} km/h`, accent: false },
              { label: 'XP EARNED', value: xp, accent: true },
            ].map((m) => (
              <View key={m.label} style={styles.gridCard}>
                <Text style={styles.gridLabel}>{m.label}</Text>
                <Text
                  style={[
                    styles.gridValue,
                    m.accent && styles.gridValueAccent,
                  ]}
                >
                  {m.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Mini Route Overview */}
          <View style={styles.routeCard}>
            <Svg width="100%" height={88} viewBox="0 0 320 88">
              <Rect width="320" height="88" fill="#1C2333" rx="18" />
              {[22, 48, 70].map((y) => (
                <Rect key={y} x="0" y={y} width="320" height="6" fill="#222A3A" />
              ))}
              {[55, 125, 195, 265].map((x) => (
                <Rect key={x} x={x} y="0" width="6" height="88" fill="#222A3A" />
              ))}
              <Polyline
                points="20,72 72,55 120,44 165,40 210,48 262,32 300,20"
                fill="none"
                stroke="#9BEA20"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="20" cy="72" r="4" fill="#9BEA20" opacity={0.7} />
              <Circle cx="300" cy="20" r="5" fill="#9BEA20" />
            </Svg>
          </View>

          {/* Streak Bonus Banner */}
          <View style={styles.streakBanner}>
            <View>
              <Text style={styles.streakTitle}>🔥 8 Day Streak!</Text>
              <Text style={styles.streakSub}>Keep the momentum going.</Text>
            </View>
            <Text style={styles.streakXP}>+50 XP</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.replace('/(main)/home' as any)}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Save Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(main)/progress' as any)}
              style={styles.progressBtn}
            >
              <Text style={styles.progressBtnText}>View Progress</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(155, 234, 32, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#9BEA20',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainMetricSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bigDistance: {
    fontSize: 72,
    fontWeight: '900',
    color: '#F7F8F9',
    lineHeight: 76,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: -4,
  },
  durationText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F7F8F9',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  gridCard: {
    width: '48.3%',
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F7F8F9',
  },
  gridValueAccent: {
    color: '#9BEA20',
  },
  routeCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(155, 234, 32, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.2)',
    marginBottom: 24,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  streakXP: {
    fontSize: 17,
    fontWeight: '900',
    color: '#9BEA20',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#F7F8F9',
    fontSize: 15,
    fontWeight: '700',
  },
  progressBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: '#9BEA20',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  progressBtnText: {
    color: '#111214',
    fontSize: 15,
    fontWeight: '800',
  },
});
