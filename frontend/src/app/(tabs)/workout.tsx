import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Footprints,
  Bike,
  Compass,
  Mountain,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ActivityType } from '@/types/workout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Discipline {
  id: ActivityType;
  title: string;
  subtitle: string;
  icon: typeof Footprints;
  accent: string;
}

const DISCIPLINES: Discipline[] = [
  {
    id: 'running',
    title: 'Outdoor Run',
    subtitle: 'Cadence & Pace tracking',
    icon: Footprints,
    accent: '#00D494',
  },
  {
    id: 'cycling',
    title: 'Road Cycling',
    subtitle: 'Velocity & Distance',
    icon: Bike,
    accent: '#00E5FF',
  },
  {
    id: 'walking',
    title: 'Daily Walk',
    subtitle: 'Low impact cardio',
    icon: Compass,
    accent: '#F59E0B',
  },
  {
    id: 'hiking',
    title: 'Trail Hike',
    subtitle: 'Terrain exploration',
    icon: Mountain,
    accent: '#C084FC',
  },
];

const TARGET_PRESETS = [
  { label: 'Open Target', value: 0 },
  { label: '1.0 KM', value: 1.0 },
  { label: '3.0 KM', value: 3.0 },
  { label: '5.0 KM', value: 5.0 },
  { label: '10.0 KM', value: 10.0 },
];

export default function TrackWorkoutScreen() {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('running');
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [gpsReady, setGpsReady] = useState(false);

  useEffect(() => {
    async function checkGPS() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          setGpsReady(true);
        } else {
          const req = await Location.requestForegroundPermissionsAsync();
          setGpsReady(req.status === Location.PermissionStatus.GRANTED);
        }
      } catch {
        setGpsReady(false);
      }
    }
    checkGPS();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(tracker)/tracking' as any,
      params: {
        activityType: selectedActivity,
        targetDistance: selectedTarget.toString(),
      },
    });
  };

  const selectedDiscipline = DISCIPLINES.find((d) => d.id === selectedActivity) || DISCIPLINES[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Track Workout</Text>
          <View style={styles.gpsRow}>
            <View style={[styles.gpsDot, gpsReady && styles.gpsDotActive]} />
            <Text style={styles.gpsText}>{gpsReady ? 'GPS Ready' : 'Acquiring Satellites...'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Square Cards Grid for Disciplines */}
        <Text style={styles.sectionLabel}>ACTIVITY DISCIPLINE</Text>
        <View style={styles.gridContainer}>
          {DISCIPLINES.map((item, idx) => {
            const isSelected = selectedActivity === item.id;
            const Icon = item.icon;

            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(idx * 50).duration(400)}
                style={styles.gridItem}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.squareCard,
                    isSelected && { borderColor: item.accent, backgroundColor: '#1C1C26' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedActivity(item.id);
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && { backgroundColor: `${item.accent}20` },
                    ]}
                  >
                    <Icon size={24} color={isSelected ? item.accent : '#94A3B8'} />
                  </View>

                  <Text style={[styles.cardTitle, isSelected && { color: item.accent }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Distance Target Preset Chips */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TARGET DISTANCE</Text>
        <View style={styles.targetRow}>
          {TARGET_PRESETS.map((preset) => {
            const isTargetActive = selectedTarget === preset.value;
            return (
              <TouchableOpacity
                key={preset.label}
                activeOpacity={0.8}
                style={[
                  styles.targetChip,
                  isTargetActive && styles.targetChipActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTarget(preset.value);
                }}
              >
                <Text
                  style={[
                    styles.targetChipText,
                    isTargetActive && styles.targetChipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Safe Corridor AI Highlight Card */}
        <View style={styles.aiSafeCard}>
          <ShieldCheck size={20} color="#00E5FF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiSafeTitle}>AI Safe Routing Enabled</Text>
            <Text style={styles.aiSafeDesc}>
              Tap ✨ during your workout to generate a well-lit safe loop.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating 1-Tap CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.startBtn}
          onPress={handleStart}
        >
          <LinearGradient
            colors={['#00E5FF', '#00D494']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startGradient}
          >
            <Text style={styles.startBtnText}>
              START {selectedDiscipline.title.toUpperCase()}
              {selectedTarget > 0 ? ` • ${selectedTarget} KM` : ''}
            </Text>
            <ChevronRight size={20} color="#000000" strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  gpsDotActive: {
    backgroundColor: '#00D494',
  },
  gpsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // 2x2 Square Cards Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  squareCard: {
    backgroundColor: '#181820',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },

  // Target Chips
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  targetChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: '#00E5FF',
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  targetChipTextActive: {
    color: '#00E5FF',
  },

  // AI Safe Corridor
  aiSafeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#181820',
    borderRadius: 16,
    padding: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  aiSafeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00E5FF',
  },
  aiSafeDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Footer CTA
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 84 : 64,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 16, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
