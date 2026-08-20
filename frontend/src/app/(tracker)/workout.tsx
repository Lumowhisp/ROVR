import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Footprints,
  Bike,
  Compass,
  Mountain,
  Navigation,
  Target,
  Zap,
} from 'lucide-react-native';
import type { ActivityType } from '@/types/workout';
import { workoutStorage, type CumulativeStats } from '@/services/workoutStorage';
import BottomNav from '@/components/BottomNav';

interface ActivityMode {
  id: ActivityType;
  label: string;
  desc: string;
  xp: string;
  kcal: string;
  icon: typeof Footprints;
}

const MODES: ActivityMode[] = [
  { id: 'running', label: 'RUN', desc: 'Track GPS route, pace & distance', xp: '1.2×', kcal: '~680 kcal/hr', icon: Footprints },
  { id: 'cycling', label: 'CYCLING', desc: 'Speed, cadence & elevation', xp: '1.0×', kcal: '~520 kcal/hr', icon: Bike },
  { id: 'walking', label: 'WALK', desc: 'Steps, distance & pace', xp: '0.7×', kcal: '~280 kcal/hr', icon: Compass },
  { id: 'hiking', label: 'TRAIL HIKE', desc: 'Elevation, terrain & route', xp: '1.5×', kcal: '~420 kcal/hr', icon: Mountain },
];

const TARGET_PRESETS = [
  { label: 'Open', value: 0 },
  { label: '1.0 KM', value: 1.0 },
  { label: '3.0 KM', value: 3.0 },
  { label: '5.0 KM', value: 5.0 },
  { label: '10.0 KM', value: 10.0 },
];

export default function WorkoutScreen() {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('running');
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ready' | 'denied'>('checking');
  const [stats, setStats] = useState<CumulativeStats>({
    totalWorkouts: 0,
    totalDistanceKm: 0,
    totalDurationSeconds: 0,
    totalCaloriesBurned: 0,
    totalXP: 0,
  });

  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        const cumulative = await workoutStorage.getCumulativeStats();
        setStats(cumulative);
      }
      loadStats();
    }, [])
  );

  useEffect(() => {
    async function checkGPS() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          setGpsStatus('ready');
        } else {
          const requested = await Location.requestForegroundPermissionsAsync();
          setGpsStatus(
            requested.status === Location.PermissionStatus.GRANTED ? 'ready' : 'denied'
          );
        }
      } catch {
        setGpsStatus('denied');
      }
    }
    checkGPS();
  }, []);

  const handleSelectActivity = (id: ActivityType) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelectedActivity(id);
  };

  const handleSelectTarget = (val: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelectedTarget(val);
  };

  const handleStartWorkout = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    router.push({
      pathname: '/(tracker)/tracking' as any,
      params: {
        activityType: selectedActivity,
        targetDistance: selectedTarget.toString(),
      },
    });
  };

  const selectedItem = MODES.find((m) => m.id === selectedActivity) || MODES[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Workout</Text>
            <Text style={styles.subtitle}>Choose your movement.</Text>
          </View>

          {/* GPS indicator */}
          <TouchableOpacity
            style={styles.gpsBadge}
            onPress={() => router.push('/(tracker)/gps_test')}
          >
            <View
              style={[
                styles.gpsDot,
                gpsStatus === 'ready'
                  ? styles.gpsDotActive
                  : gpsStatus === 'checking'
                  ? styles.gpsDotChecking
                  : styles.gpsDotDenied,
              ]}
            />
            <Text style={styles.gpsText}>
              {gpsStatus === 'ready'
                ? 'GPS Active'
                : gpsStatus === 'checking'
                ? 'Locking…'
                : 'GPS Offline'}
            </Text>
            <Navigation size={12} color="#9BEA20" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Lifetime Quick Stats Strip */}
          {stats.totalWorkouts > 0 && (
            <View style={styles.statsStrip}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.totalDistanceKm.toFixed(1)} km</Text>
                <Text style={styles.statLbl}>TOTAL LOGGED</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLbl}>SESSIONS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Zap size={11} color="#9BEA20" />
                  <Text style={[styles.statVal, { color: '#9BEA20' }]}>{stats.totalXP}</Text>
                </View>
                <Text style={styles.statLbl}>XP EARNED</Text>
              </View>
            </View>
          )}

          {/* Workout Modes List */}
          <View style={styles.modesList}>
            {MODES.map((m) => {
              const isSel = selectedActivity === m.id;
              const Icon = m.icon;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.88}
                  onPress={() => handleSelectActivity(m.id)}
                  style={[
                    styles.modeCard,
                    isSel ? styles.modeCardSelected : styles.modeCardUnselected,
                  ]}
                >
                  <View style={styles.modeCardInner}>
                    {/* Icon Box */}
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: isSel
                            ? '#111214'
                            : 'rgba(255, 255, 255, 0.08)',
                        },
                      ]}
                    >
                      <Icon
                        size={22}
                        color={isSel ? '#9BEA20' : 'rgba(255, 255, 255, 0.45)'}
                      />
                    </View>

                    {/* Mode Information */}
                    <View style={styles.modeInfo}>
                      <Text
                        style={[
                          styles.modeLabel,
                          { color: isSel ? '#111214' : '#F7F8F9' },
                        ]}
                      >
                        {m.label}
                      </Text>
                      <Text
                        style={[
                          styles.modeDesc,
                          { color: isSel ? '#687078' : 'rgba(255, 255, 255, 0.4)' },
                        ]}
                      >
                        {m.desc}
                      </Text>

                      {/* Pills */}
                      <View style={styles.pillsRow}>
                        <View
                          style={[
                            styles.pill,
                            {
                              backgroundColor: isSel
                                ? 'rgba(155, 234, 32, 0.18)'
                                : 'rgba(255, 255, 255, 0.06)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillTextBold,
                              { color: isSel ? '#3F6212' : 'rgba(255, 255, 255, 0.5)' },
                            ]}
                          >
                            {m.xp} XP
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.pill,
                            {
                              backgroundColor: isSel
                                ? 'rgba(0, 0, 0, 0.06)'
                                : 'rgba(255, 255, 255, 0.04)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              { color: isSel ? '#687078' : 'rgba(255, 255, 255, 0.4)' },
                            ]}
                          >
                            {m.kcal}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Active Radio Badge */}
                    {isSel && (
                      <View style={styles.radioOuter}>
                        <View style={styles.radioInner} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Session Target Presets */}
          <View style={styles.targetSection}>
            <View style={styles.targetHeader}>
              <Target size={14} color="#9BEA20" />
              <Text style={styles.targetTitle}>Session Target (Optional)</Text>
            </View>

            <View style={styles.targetRow}>
              {TARGET_PRESETS.map((preset) => {
                const isTargetActive = selectedTarget === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    activeOpacity={0.8}
                    onPress={() => handleSelectTarget(preset.value)}
                    style={[
                      styles.targetPill,
                      isTargetActive && styles.targetPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.targetPillText,
                        isTargetActive && styles.targetPillTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Floating Start Workout CTA */}
        <View style={styles.ctaWrapper}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartWorkout}
            style={styles.startBtn}
          >
            <Text style={styles.startBtnText}>
              Start {selectedItem.label} →
            </Text>
          </TouchableOpacity>
        </View>

        <BottomNav active="workout" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F7F8F9',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 1,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  gpsDotActive: {
    backgroundColor: '#9BEA20',
  },
  gpsDotChecking: {
    backgroundColor: '#F59E0B',
  },
  gpsDotDenied: {
    backgroundColor: '#EF4444',
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F7F8F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  modesList: {
    gap: 12,
    marginBottom: 20,
  },
  modeCard: {
    borderRadius: 26,
    padding: 18,
    borderWidth: 1.5,
  },
  modeCardSelected: {
    backgroundColor: '#F7F8F9',
    borderColor: 'rgba(155, 234, 32, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  modeCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modeCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  pillTextBold: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#9BEA20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111214',
  },
  targetSection: {
    marginBottom: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  targetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  targetPillActive: {
    backgroundColor: 'rgba(155, 234, 32, 0.2)',
    borderColor: '#9BEA20',
  },
  targetPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  targetPillTextActive: {
    color: '#9BEA20',
  },
  ctaWrapper: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  startBtn: {
    backgroundColor: '#9BEA20',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  startBtnText: {
    color: '#111214',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});