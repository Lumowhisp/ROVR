import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  Trophy,
  Target,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  avgPace: string;
  calPerHour: number;
  xpMultiplier: string;
}

const ACTIVITIES: ActivityOption[] = [
  {
    id: 'running',
    title: 'Outdoor Run',
    subtitle: 'Track GPS route, pace, distance & active burn',
    icon: Footprints,
    gradient: ['#98E527', '#4ADE80'],
    accentColor: '#98E527',
    avgPace: "5'30\" /km",
    calPerHour: 680,
    xpMultiplier: '1.2x XP',
  },
  {
    id: 'cycling',
    title: 'Road Cycling',
    subtitle: 'High-speed GPS tracking, velocity & cadence metrics',
    icon: Bike,
    gradient: ['#00D4FF', '#3B82F6'],
    accentColor: '#00D4FF',
    avgPace: '22 km/h',
    calPerHour: 550,
    xpMultiplier: '1.0x XP',
  },
  {
    id: 'walking',
    title: 'Daily Walk',
    subtitle: 'Low impact cardio, step counting & daily streak',
    icon: Compass,
    gradient: ['#F59E0B', '#EAB308'],
    accentColor: '#F59E0B',
    avgPace: "11'00\" /km",
    calPerHour: 280,
    xpMultiplier: '1.0x XP',
  },
  {
    id: 'hiking',
    title: 'Trail Hike',
    subtitle: 'Elevation gain, terrain exploration & landmark quests',
    icon: Mountain,
    gradient: ['#A855F7', '#EC4899'],
    accentColor: '#A855F7',
    avgPace: "14'30\" /km",
    calPerHour: 420,
    xpMultiplier: '1.3x XP',
  },
];

const TARGET_PRESETS = [
  { label: 'Open Goal', value: 0 },
  { label: '1.0 KM', value: 1.0 },
  { label: '3.0 KM', value: 3.0 },
  { label: '5.0 KM', value: 5.0 },
  { label: '10.0 KM', value: 10.0 },
];

export default function WorkoutScreen() {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('running');
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [routeMode, setRouteMode] = useState<'manual' | 'safe_loop'>('manual');
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ready' | 'denied'>('checking');
  const [stats, setStats] = useState<CumulativeStats>({
    totalWorkouts: 0,
    totalDistanceKm: 0,
    totalDurationSeconds: 0,
    totalCaloriesBurned: 0,
    totalXP: 0,
  });

  const buttonScale = useSharedValue(1);

  // Load athlete cumulative stats on screen focus
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(id);
  };

  const handleSelectTarget = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTarget(val);
    if (val > 0) {
      setRouteMode('safe_loop');
    } else {
      setRouteMode('manual');
    }
  };

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(tracker)/tracking' as any,
      params: {
        activityType: selectedActivity,
        targetDistance: selectedTarget.toString(),
        routeMode,
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
      buttonScale.value = withSpring(0.97, { damping: 15 });
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0A0A0F', '#12121A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Workout Mode</Text>
          <View style={styles.gpsIndicator}>
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
                ? 'GPS Online'
                : gpsStatus === 'checking'
                ? 'Acquiring GPS...'
                : 'GPS Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.gpsTestButton}
          onPress={() => router.push('/(tracker)/gps_test' as any)}
        >
          <Navigation size={18} color="#98E527" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cumulative Stats Ribbon */}
        {stats.totalWorkouts > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.statsRibbon}>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonVal}>{stats.totalDistanceKm.toFixed(1)} km</Text>
              <Text style={styles.ribbonLabel}>All-Time Distance</Text>
            </View>
            <View style={styles.ribbonDivider} />
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonVal}>{stats.totalWorkouts}</Text>
              <Text style={styles.ribbonLabel}>Sessions</Text>
            </View>
            <View style={styles.ribbonDivider} />
            <View style={styles.ribbonItem}>
              <View style={styles.xpRow}>
                <Trophy size={13} color="#98E527" />
                <Text style={[styles.ribbonVal, { color: '#98E527' }]}>
                  {stats.totalXP}
                </Text>
              </View>
              <Text style={styles.ribbonLabel}>Total XP</Text>
            </View>
          </Animated.View>
        )}

        {/* Title Section */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.titleSection}>
          <Text style={styles.mainHeading}>Select Activity</Text>
          <Text style={styles.subHeading}>
            Choose your activity discipline to initialize real-time GPS telemetry and XP scoring.
          </Text>
        </Animated.View>

        {/* Activity Cards List */}
        <View style={styles.activityList}>
          {ACTIVITIES.map((activity, index) => {
            const isSelected = selectedActivity === activity.id;
            const Icon = activity.icon;

            return (
              <Animated.View
                key={activity.id}
                entering={FadeInDown.delay(index * 70).duration(400)}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.activityCard,
                    isSelected && {
                      borderColor: activity.accentColor,
                      backgroundColor: '#161622',
                    },
                  ]}
                  onPress={() => handleSelectActivity(activity.id)}
                >
                  <LinearGradient
                    colors={activity.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}
                  >
                    <Icon size={24} color="#000000" strokeWidth={2.5} />
                  </LinearGradient>

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
                      <View style={styles.xpBadge}>
                        <Zap size={12} color="#98E527" />
                        <Text style={styles.xpBadgeText}>{activity.xpMultiplier}</Text>
                      </View>
                    </View>

                    <Text style={styles.activitySubtitle} numberOfLines={2}>
                      {activity.subtitle}
                    </Text>

                    {/* Meta stats tags */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaTag}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text style={styles.metaText}>{activity.avgPace}</Text>
                      </View>
                      <View style={styles.metaTag}>
                        <Flame size={12} color="#F97316" />
                        <Text style={styles.metaText}>~{activity.calPerHour} kcal/hr</Text>
                      </View>
                    </View>
                  </View>

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

        {/* Distance Target Presets (Optional) */}
        <Animated.View entering={FadeInUp.delay(280).duration(400)} style={styles.targetSection}>
          <View style={styles.targetHeader}>
            <Target size={16} color="#98E527" />
            <Text style={styles.targetTitle}>Session Target (Optional)</Text>
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

        {/* Live Feature Preview Banner */}
        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.previewBanner}>
          <View style={styles.previewHeader}>
            <Zap size={18} color="#98E527" />
            <Text style={styles.previewTitle}>Freeform GPS Tracking</Text>
          </View>
          <Text style={styles.previewDesc}>
            Freely walk, run, or cycle. ROVR records your real-time path, distance, pace, and active burn with precision telemetry.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom Action CTA */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
        <Animated.View style={buttonAnimStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleStartWorkout}
            style={styles.startButtonWrap}
          >
            <LinearGradient
              colors={['#98E527', '#4ADE80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>
                START {selectedItem.title.toUpperCase()}
                {selectedTarget > 0 ? ` (${selectedTarget} KM)` : ''}
              </Text>
              <ChevronRight size={22} color="#000000" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  gpsDotActive: {
    backgroundColor: '#98E527',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
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
    paddingTop: 20,
    paddingBottom: 110,
  },
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#13131F',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#222234',
    marginBottom: 20,
  },
  ribbonItem: {
    alignItems: 'center',
  },
  ribbonVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ribbonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  ribbonDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#222234',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleSection: {
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginTop: 6,
  },
  activityList: {
    gap: 12,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E1E2E',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(152, 229, 39, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.25)',
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#98E527',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 8,
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
    marginLeft: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  targetSection: {
    backgroundColor: '#12121A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    marginBottom: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  targetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: '#181824',
    borderWidth: 1,
    borderColor: '#242436',
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
  safeRouteCard: {
    marginTop: 14,
    backgroundColor: '#161624',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242438',
  },
  safeRouteCardActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
  },
  safeRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safeRouteIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeRouteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  safeRouteSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A2A3E',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#00D4FF',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  previewBanner: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  startButtonWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});