import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  ChevronRight,
  Plus,
  Flame,
  MapPin,
  Clock,
  Footprints,
  Sparkles,
  Check,
  Award,
  Activity,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { workoutStorage, type CumulativeStats } from '@/services/workoutStorage';
import { useSteps } from '@/context/StepContext';
import type { WorkoutSummary } from '@/types/workout';
import { useAuth } from '@/context/AuthContext';
import TomTomMap from '@/components/map/TomTomMap';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { todaySteps, refreshSteps } = useSteps();

  const [stats, setStats] = useState<CumulativeStats>({
    totalWorkouts: 0,
    totalDistanceKm: 0,
    totalDurationSeconds: 0,
    totalCaloriesBurned: 0,
    totalXP: 0,
    totalSteps: 0,
  });
  const [recentWorkout, setRecentWorkout] = useState<WorkoutSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadRealData() {
        const cumulative = await workoutStorage.getCumulativeStats();
        setStats(cumulative);

        const workouts = await workoutStorage.getAllWorkouts();
        if (workouts.length > 0) {
          setRecentWorkout(workouts[0]);
        } else {
          setRecentWorkout(null);
        }

        refreshSteps();
      }
      loadRealData();
    }, [refreshSteps])
  );

  const moveMin = Math.round(stats.totalDurationSeconds / 60);
  const targetXP = 500;
  const xpPercent = Math.min(100, Math.round((stats.totalXP / targetXP) * 100));

  // Determine which days in the current week had recorded activity
  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.appTitle}>ROVR</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Settings size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Concentric Progress Rings (Real Steps & XP) */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ringSection}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.ringPrimaryVal}>{stats.totalXP}</Text>
              <Text style={styles.ringSecondaryVal}>{todaySteps.toLocaleString()}</Text>
            </View>
          </View>

          {/* Sub-Legend */}
          <View style={styles.ringLegendRow}>
            <View style={styles.legendItem}>
              <Zap size={14} color="#00D494" fill="#00D494" />
              <Text style={styles.legendText}>ROVR XP</Text>
            </View>
            <View style={styles.legendItem}>
              <Footprints size={14} color="#00E5FF" />
              <Text style={styles.legendText}>Today's Steps</Text>
            </View>
          </View>
        </Animated.View>

        {/* 3 Square Stat Cards Row (Real Data) */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsSquareRow}>
          <View style={styles.squareCard}>
            <Text style={styles.squareVal}>{stats.totalCaloriesBurned}</Text>
            <Text style={styles.squareUnit}>Active Cal</Text>
          </View>

          <View style={styles.squareCard}>
            <Text style={styles.squareVal}>{stats.totalDistanceKm.toFixed(2)}</Text>
            <Text style={styles.squareUnit}>km Distance</Text>
          </View>

          <View style={styles.squareCard}>
            <Text style={styles.squareVal}>{moveMin}</Text>
            <Text style={styles.squareUnit}>Move Min</Text>
          </View>
        </Animated.View>

        {/* Activity Streak & Daily Goals */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Activity Streak</Text>
              <Text style={styles.cardSubtitle}>This Week</Text>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </View>

          <View style={styles.goalsRow}>
            <View style={styles.goalsScoreWrap}>
              <Text style={styles.goalsRatio}>
                {stats.totalWorkouts > 0 ? `${Math.min(7, stats.totalWorkouts)}/7` : '0/7'}
              </Text>
              <Text style={styles.goalsAchieved}>Workouts</Text>
            </View>

            <View style={styles.dayRingsRow}>
              {DAYS.map((day, idx) => {
                const isToday = idx === currentDayIndex;
                const hasActivity = stats.totalWorkouts > 0 && idx <= currentDayIndex && stats.totalWorkouts >= (idx + 1);

                return (
                  <View key={idx} style={styles.dayCol}>
                    <View
                      style={[
                        styles.dayRing,
                        hasActivity && styles.dayRingActive,
                        isToday && styles.dayRingToday,
                      ]}
                    >
                      {hasActivity && <Check size={11} color="#00D494" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.dayText, isToday && { color: '#00E5FF' }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Weekly XP Target */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly XP Goal</Text>
              <Text style={styles.cardSubtitle}>{stats.totalXP} of {targetXP} XP</Text>
            </View>
            <Text style={styles.percentText}>{xpPercent}%</Text>
          </View>

          <View style={styles.targetBarTrack}>
            <View style={[styles.targetBarFill, { width: `${xpPercent}%` }]} />
          </View>

          <View style={styles.whoBanner}>
            <View style={styles.whoIconWrap}>
              <Award size={18} color="#00E5FF" />
            </View>
            <Text style={styles.whoText}>
              {stats.totalWorkouts > 0
                ? `You've completed ${stats.totalWorkouts} sessions. Keep your momentum going!`
                : 'Start your first workout to start accumulating XP and level up.'}
            </Text>
          </View>
        </Animated.View>

        {/* Recent Workout Section (Adapts if 0 workouts exist) */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.sectionCard}>
          {recentWorkout ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(tabs)/journal')}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    Last Workout • {recentWorkout.activityType.charAt(0).toUpperCase() + recentWorkout.activityType.slice(1)}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {recentWorkout.distanceKm} km • {Math.round(recentWorkout.durationSeconds / 60)} min • +{recentWorkout.earnedXP} XP
                  </Text>
                </View>
                <ChevronRight size={18} color="#64748B" />
              </View>

              {/* Real Route Map Container */}
              <View style={styles.miniMapWrap} pointerEvents="none">
                {recentWorkout.routeCoordinates && recentWorkout.routeCoordinates.length >= 2 ? (
                  <TomTomMap
                    apiKey={process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'CzZ9FdkTfX8xctGNP452EG8rOeh2757C'}
                    currentLocation={recentWorkout.routeCoordinates[recentWorkout.routeCoordinates.length - 1]}
                    walkingPath={recentWorkout.routeCoordinates}
                    followUser={false}
                    width="100%"
                    height={160}
                  />
                ) : (
                  <View style={styles.miniMapGrid}>
                    <MapPin size={24} color="#00E5FF" />
                    <Text style={styles.miniMapLocText}>WORKOUT RECORDED</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyRecentCard}>
              <Activity size={32} color="#64748B" />
              <Text style={styles.emptyTitle}>No workouts recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Your completed runs, cycles, and walks will appear here with full GPS routes.
              </Text>
              <TouchableOpacity
                style={styles.emptyStartBtn}
                onPress={() => router.push('/(tabs)/workout')}
              >
                <Text style={styles.emptyStartBtnText}>Start First Workout</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating Google Fit `+` FAB Button */}
      <TouchableOpacity
        style={styles.floatingFab}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/workout')}
      >
        <LinearGradient
          colors={['#00E5FF', '#00D494']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Plus size={28} color="#000000" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Concentric Rings
  ringSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  ringOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    borderColor: '#00D494',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D494',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ringInner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 6,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14141A',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ringPrimaryVal: {
    fontSize: 38,
    fontWeight: '900',
    color: '#00D494',
    letterSpacing: -1,
  },
  ringSecondaryVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#00E5FF',
    marginTop: -2,
  },
  ringLegendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // 3 Square Stat Cards
  statsSquareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  squareCard: {
    flex: 1,
    backgroundColor: '#181820',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  squareVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  squareUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3,
    textTransform: 'uppercase',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#181820',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00D494',
  },

  // Goals
  goalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalsScoreWrap: {
    marginRight: 10,
  },
  goalsRatio: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00E5FF',
  },
  goalsAchieved: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  dayRingsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#2D2D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRingActive: {
    borderColor: '#00D494',
    backgroundColor: 'rgba(0, 212, 148, 0.1)',
  },
  dayRingToday: {
    borderColor: '#00E5FF',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  // Target Bar
  targetBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D2D3A',
    overflow: 'hidden',
    marginBottom: 12,
  },
  targetBarFill: {
    height: '100%',
    backgroundColor: '#00D494',
    borderRadius: 3,
  },
  whoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  whoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // Empty state
  emptyRecentCard: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  emptyStartBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  emptyStartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E5FF',
  },

  // Mini Map Graphic
  miniMapWrap: {
    height: 160,
    borderRadius: 14,
    backgroundColor: '#14141C',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniMapGrid: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simRouteTrack: {
    width: 140,
    height: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simRoutePointStart: {
    position: 'absolute',
    left: 20,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D494',
  },
  simRouteLine: {
    width: 90,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    transform: [{ rotate: '-10deg' }],
  },
  simRoutePointEnd: {
    position: 'absolute',
    right: 20,
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  miniMapLocText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
    marginTop: 10,
  },

  // FAB
  floatingFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 75,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
