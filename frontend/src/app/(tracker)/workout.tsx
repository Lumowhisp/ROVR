import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Footprints,
  Bike,
  Flame,
  Zap,
  MapPin,
  ChevronRight,
  Compass,
  ArrowLeft,
  Navigation,
  Mountain,
  Target,
  ShieldCheck,
  Activity,
  Timer,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  runOnUI,
} from 'react-native-reanimated';
import type { ActivityType } from '@/types/workout';
import { workoutStorage, type CumulativeStats } from '@/services/workoutStorage';

interface ActivityOption {
  id: ActivityType;
  title: string;
  subtitle: string;
  icon: typeof Footprints;
  gradient: [string, string];
  accentColor: string;
  glowColor: string;
  avgPace: string;
  calPerHour: number;
  xpMultiplier: string;
}

const ACTIVITIES: ActivityOption[] = [
  {
    id: 'running',
    title: 'Outdoor Run',
    subtitle: 'GPS road tracking, cadence & active calorie burn',
    icon: Footprints,
    gradient: ['#98E527', '#22C55E'],
    accentColor: '#98E527',
    glowColor: 'rgba(152, 229, 39, 0.35)',
    avgPace: "5'30\" /km",
    calPerHour: 680,
    xpMultiplier: '+20% XP',
  },
  {
    id: 'cycling',
    title: 'Road Cycling',
    subtitle: 'High-speed velocity telemetry & elevation tracking',
    icon: Bike,
    gradient: ['#00D4FF', '#0284C7'],
    accentColor: '#00D4FF',
    glowColor: 'rgba(0, 212, 255, 0.35)',
    avgPace: '22.4 km/h',
    calPerHour: 540,
    xpMultiplier: '1.0x XP',
  },
  {
    id: 'walking',
    title: 'Daily Walk',
    subtitle: 'Low-impact cardio, step accumulation & streak bonus',
    icon: Compass,
    gradient: ['#F59E0B', '#D97706'],
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    avgPace: "10'45\" /km",
    calPerHour: 290,
    xpMultiplier: '1.0x XP',
  },
  {
    id: 'hiking',
    title: 'Trail Hike',
    subtitle: 'Terrain exploration, rugged ascent & landmark points',
    icon: Mountain,
    gradient: ['#C084FC', '#9333EA'],
    accentColor: '#C084FC',
    glowColor: 'rgba(192, 132, 252, 0.35)',
    avgPace: "14'15\" /km",
    calPerHour: 450,
    xpMultiplier: '+30% XP',
  },
];

const TARGET_PRESETS = [
  { label: 'Open Target', value: 0, desc: 'Freeform GPS' },
  { label: '1.0 KM', value: 1.0, desc: 'Quick Sprint' },
  { label: '3.0 KM', value: 3.0, desc: 'Cardio Loop' },
  { label: '5.0 KM', value: 5.0, desc: 'Standard 5K' },
  { label: '10.0 KM', value: 10.0, desc: 'Endurance' },
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
    totalSteps: 0,
  });

  const buttonScale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);

  // Breathing pulse for active indicators
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.2, { duration: 1200 }),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: withTiming(gpsStatus === 'ready' ? 1 : 0.6),
  }));

  // Load cumulative stats
  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        const cumulative = await workoutStorage.getCumulativeStats();
        setStats(cumulative);

        workoutStorage.syncFromCloud().then(async () => {
          const fresh = await workoutStorage.getCumulativeStats();
          setStats(fresh);
        }).catch(() => {});
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(id);
  };

  const handleSelectTarget = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTarget(val);
  };

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(tracker)/tracking' as any,
      params: {
        activityType: selectedActivity,
        targetDistance: selectedTarget.toString(),
      },
    });
  };

  const selectedItem = ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[0];

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    runOnUI(() => {
      'worklet';
      buttonScale.value = withSpring(0.96, { damping: 15 });
    })();
  };

  const handlePressOut = () => {
    runOnUI(() => {
      'worklet';
      buttonScale.value = withSpring(1, { damping: 15 });
    })();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Atmospheric Ambient Glows */}
      <View style={styles.ambientGlowTop} />
      <View style={[styles.ambientGlowAccent, { backgroundColor: selectedItem.glowColor }]} />

      {/* Frosted Glass Header */}
      <View style={styles.headerWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={styles.headerBlur}>
          <TouchableOpacity
            style={styles.glassCircleBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={18} color="#F1F5F9" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Workout Hub</Text>
            <View style={styles.gpsIndicator}>
              <Animated.View
                style={[
                  styles.gpsDot,
                  gpsStatus === 'ready'
                    ? styles.gpsDotActive
                    : gpsStatus === 'checking'
                    ? styles.gpsDotChecking
                    : styles.gpsDotDenied,
                  pulseStyle,
                ]}
              />
              <Text style={styles.gpsText}>
                {gpsStatus === 'ready'
                  ? 'GPS Active'
                  : gpsStatus === 'checking'
                  ? 'Locking Satellites...'
                  : 'GPS Offline'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.gpsTestButton}
            onPress={() => router.push('/(tracker)/gps_test' as any)}
          >
            <Navigation size={16} color="#98E527" />
          </TouchableOpacity>
        </BlurView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Google Fit Inspired Concentric Ring & Progress Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ringCardContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 38, 0.85)', 'rgba(14, 14, 22, 0.85)']}
            style={styles.ringCardGradient}
          >
            {/* Visual Ring Aura */}
            <View style={styles.ringVisualSection}>
              <View style={styles.ringOuter}>
                <View style={styles.ringInner}>
                  <Zap size={22} color="#98E527" />
                  <Text style={styles.ringValText}>{stats.totalXP}</Text>
                  <Text style={styles.ringSubText}>TOTAL XP</Text>
                </View>
              </View>
            </View>

            {/* Quick Metrics Columns */}
            <View style={styles.ringMetricsRow}>
              <View style={styles.ringMetricCol}>
                <View style={styles.metricIconWrap}>
                  <MapPin size={13} color="#00D4FF" />
                </View>
                <Text style={styles.ringMetricVal}>{stats.totalDistanceKm.toFixed(1)}</Text>
                <Text style={styles.ringMetricLabel}>KM LOGGED</Text>
              </View>

              <View style={styles.ringDivider} />

              <View style={styles.ringMetricCol}>
                <View style={styles.metricIconWrap}>
                  <Flame size={13} color="#F97316" />
                </View>
                <Text style={styles.ringMetricVal}>{stats.totalCaloriesBurned}</Text>
                <Text style={styles.ringMetricLabel}>ACTIVE KCAL</Text>
              </View>

              <View style={styles.ringDivider} />

              <View style={styles.ringMetricCol}>
                <View style={styles.metricIconWrap}>
                  <Activity size={13} color="#98E527" />
                </View>
                <Text style={styles.ringMetricVal}>{stats.totalWorkouts}</Text>
                <Text style={styles.ringMetricLabel}>SESSIONS</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.titleSection}>
          <Text style={styles.mainHeading}>Select Discipline</Text>
          <Text style={styles.subHeading}>
            Live GPS precision tracking with safety scored routing
          </Text>
        </Animated.View>

        {/* Glassmorphic Activity Cards List */}
        <View style={styles.activityList}>
          {ACTIVITIES.map((activity, index) => {
            const isSelected = selectedActivity === activity.id;
            const Icon = activity.icon;

            return (
              <Animated.View
                key={activity.id}
                entering={FadeInDown.delay(index * 60 + 150).duration(400)}
              >
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[
                    styles.activityCard,
                    isSelected && [
                      styles.activityCardSelected,
                      { borderColor: activity.accentColor },
                    ],
                  ]}
                  onPress={() => handleSelectActivity(activity.id)}
                >
                  {/* Active Neon Accent Left Strip */}
                  {isSelected && (
                    <LinearGradient
                      colors={activity.gradient}
                      style={styles.selectedLeftStripe}
                    />
                  )}

                  {/* Icon Circle with Frosted Glow */}
                  <View style={styles.iconCircleWrapper}>
                    <LinearGradient
                      colors={activity.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconCircle}
                    >
                      <Icon size={22} color="#000000" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>

                  <View style={styles.activityInfo}>
                    <View style={styles.cardHeaderRow}>
                      <Text
                        style={[
                          styles.activityTitle,
                          isSelected && { color: activity.accentColor },
                        ]}
                      >
                        {activity.title}
                      </Text>
                      <View
                        style={[
                          styles.xpBadge,
                          isSelected && {
                            backgroundColor: `${activity.accentColor}20`,
                            borderColor: `${activity.accentColor}50`,
                          },
                        ]}
                      >
                        <Zap size={10} color={activity.accentColor} />
                        <Text
                          style={[
                            styles.xpBadgeText,
                            { color: activity.accentColor },
                          ]}
                        >
                          {activity.xpMultiplier}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.activitySubtitle} numberOfLines={2}>
                      {activity.subtitle}
                    </Text>

                    {/* Metadata Tags */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaTag}>
                        <Timer size={11} color="#64748B" />
                        <Text style={styles.metaText}>{activity.avgPace}</Text>
                      </View>
                      <View style={styles.metaTag}>
                        <Flame size={11} color="#F97316" />
                        <Text style={styles.metaText}>~{activity.calPerHour} kcal/h</Text>
                      </View>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && { borderColor: activity.accentColor },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: activity.accentColor },
                          ]}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Distance Target Preset Chips (Google Fit Styled) */}
        <Animated.View entering={FadeInUp.delay(350).duration(450)} style={styles.targetSection}>
          <View style={styles.targetHeader}>
            <View style={styles.targetIconWrap}>
              <Target size={14} color="#98E527" />
            </View>
            <View>
              <Text style={styles.targetTitle}>Session Target</Text>
              <Text style={styles.targetSubtitle}>Set an optional distance milestone</Text>
            </View>
          </View>

          <View style={styles.targetPillRow}>
            {TARGET_PRESETS.map((preset) => {
              const isTargetActive = selectedTarget === preset.value;
              return (
                <TouchableOpacity
                  key={preset.label}
                  activeOpacity={0.8}
                  style={[
                    styles.targetPill,
                    isTargetActive && styles.targetPillActive,
                  ]}
                  onPress={() => handleSelectTarget(preset.value)}
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
        </Animated.View>

        {/* Safety Corridor AI Feature Teaser */}
        <Animated.View entering={FadeInUp.delay(400).duration(450)} style={styles.aiCorridorBanner}>
          <LinearGradient
            colors={['rgba(0, 212, 255, 0.12)', 'rgba(15, 23, 42, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCorridorGradient}
          >
            <View style={styles.aiIconWrap}>
              <ShieldCheck size={20} color="#00D4FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCorridorTitle}>On-Demand AI Safe Routes</Text>
              <Text style={styles.aiCorridorDesc}>
                Tap ✨ anytime during your workout to generate a well-lit, low-traffic safe loop.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Frosted Floating Bottom CTA */}
      <View style={styles.footerWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 45 : 85} tint="dark" style={styles.footerBlur}>
          <Animated.View style={buttonAnimStyle}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleStartWorkout}
              style={styles.startButtonWrap}
            >
              <LinearGradient
                colors={selectedItem.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>
                  START {selectedItem.title.toUpperCase()}
                  {selectedTarget > 0 ? ` • ${selectedTarget} KM` : ''}
                </Text>
                <ChevronRight size={20} color="#000000" strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -80,
    left: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(152, 229, 39, 0.08)',
  },
  ambientGlowAccent: {
    position: 'absolute',
    bottom: 120,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.5,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  glassCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  gpsDotActive: {
    backgroundColor: '#98E527',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  gpsDotChecking: {
    backgroundColor: '#F59E0B',
  },
  gpsDotDenied: {
    backgroundColor: '#EF4444',
  },
  gpsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  gpsTestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(152, 229, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.3)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 120 : 112,
    paddingBottom: 120,
  },

  // Concentric Ring & Progress Card
  ringCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ringCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  ringVisualSection: {
    marginBottom: 16,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  ringInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#98E527',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  ringValText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
  ringSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#98E527',
    letterSpacing: 1,
  },
  ringMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ringMetricCol: {
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ringMetricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ringMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  ringDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Title Section
  titleSection: {
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subHeading: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Activity Cards
  activityList: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  activityCardSelected: {
    backgroundColor: 'rgba(28, 28, 42, 0.95)',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  selectedLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconCircleWrapper: {
    marginRight: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  activityInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  xpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activitySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Target Section
  targetSection: {
    backgroundColor: 'rgba(20, 20, 30, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  targetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(152, 229, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  targetPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  targetPillActive: {
    backgroundColor: 'rgba(152, 229, 39, 0.15)',
    borderColor: '#98E527',
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  targetPillTextActive: {
    color: '#98E527',
  },

  // AI Safe Corridor Banner
  aiCorridorBanner: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  aiCorridorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCorridorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00D4FF',
    letterSpacing: 0.2,
  },
  aiCorridorDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    marginTop: 2,
  },

  // Floating Footer CTA
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  footerBlur: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  startButtonWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});