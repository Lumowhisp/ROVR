import React, { useState, useCallback } from 'react';
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
import {
  RotateCcw,
  Footprints,
  Bike,
  Compass,
  Mountain,
  Plus,
  Zap,
  Calendar,
  Activity,
  Flame,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { workoutStorage } from '@/services/workoutStorage';
import type { WorkoutSummary, ActivityType } from '@/types/workout';
import { useAuth } from '@/context/AuthContext';

interface FormattedGroup {
  dateLabel: string;
  totalDistanceKm: number;
  totalXP: number;
  items: WorkoutSummary[];
}

function formatGroupDate(timestamp: number): string {
  const workoutDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    workoutDate.getDate() === now.getDate() &&
    workoutDate.getMonth() === now.getMonth() &&
    workoutDate.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    workoutDate.getDate() === yesterday.getDate() &&
    workoutDate.getMonth() === yesterday.getMonth() &&
    workoutDate.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return workoutDate.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkouts = async () => {
    setIsLoading(true);
    const list = await workoutStorage.getAllWorkouts();
    setWorkouts(list);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  // Group real workouts by date
  const groups: FormattedGroup[] = [];
  workouts.forEach((w) => {
    const label = formatGroupDate(w.startTime);
    let group = groups.find((g) => g.dateLabel === label);
    if (!group) {
      group = {
        dateLabel: label,
        totalDistanceKm: 0,
        totalXP: 0,
        items: [],
      };
      groups.push(group);
    }
    group.totalDistanceKm += w.distanceKm;
    group.totalXP += w.earnedXP;
    group.items.push(w);
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'cycling':
        return Bike;
      case 'hiking':
        return Mountain;
      case 'running':
        return Footprints;
      default:
        return Compass;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journal</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={loadWorkouts}
          >
            <RotateCcw size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
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
        {groups.length > 0 ? (
          groups.map((group, groupIdx) => (
            <Animated.View
              key={group.dateLabel}
              entering={FadeInDown.delay(groupIdx * 80).duration(400)}
              style={styles.groupContainer}
            >
              {/* Group Date Header */}
              <View style={styles.groupHeader}>
                <Text style={styles.groupDate}>{group.dateLabel}</Text>
                <View style={styles.groupStatsRight}>
                  <Text style={styles.groupStatText}>{group.totalDistanceKm.toFixed(2)} km</Text>
                  <Zap size={11} color="#00D494" style={{ marginLeft: 6 }} />
                  <Text style={[styles.groupStatText, { color: '#00D494', fontWeight: '700' }]}>
                    +{group.totalXP} XP
                  </Text>
                </View>
              </View>

              {/* Workout Items */}
              <View style={styles.itemsList}>
                {group.items.map((item) => {
                  const Icon = getActivityIcon(item.activityType);
                  const timeString = new Date(item.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const durationMin = Math.round(item.durationSeconds / 60);

                  return (
                    <View key={item.id} style={styles.workoutRow}>
                      {/* Left Activity Icon */}
                      <View style={styles.activityCircle}>
                        <Icon size={20} color="#00E5FF" />
                      </View>

                      {/* Middle Info */}
                      <View style={styles.workoutInfo}>
                        <Text style={styles.workoutTimeText}>{timeString}</Text>
                        <Text style={styles.workoutTitle}>
                          {item.activityType.charAt(0).toUpperCase() + item.activityType.slice(1)} Session
                        </Text>
                        <Text style={styles.workoutMetrics}>
                          {item.distanceKm} km in {durationMin} min • {item.caloriesBurned} kcal
                        </Text>
                        <View style={styles.xpPill}>
                          <Zap size={10} color="#00D494" />
                          <Text style={styles.xpPillText}>+{item.earnedXP} XP</Text>
                        </View>
                      </View>

                      {/* Right Route Graphic */}
                      <View style={styles.routeThumbCircle}>
                        <View style={styles.simThumbRoute} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          ))
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <Activity size={48} color="#334155" />
            <Text style={styles.emptyTitle}>Your Journal is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Every completed outdoor run, road cycle, and walk will automatically be recorded here with complete telemetry.
            </Text>
            <TouchableOpacity
              style={styles.emptyStartBtn}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <LinearGradient
                colors={['#00E5FF', '#00D494']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyStartGradient}
              >
                <Text style={styles.emptyStartText}>Record First Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Google Fit `+` FAB */}
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
  headerTitle: {
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
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

  // Groups
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  groupDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  groupStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupStatText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Items
  itemsList: {
    gap: 12,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181820',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  activityCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTimeText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  workoutMetrics: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  xpPillText: {
    fontSize: 11,
    color: '#00D494',
    fontWeight: '700',
  },
  routeThumbCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#14141C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  simThumbRoute: {
    width: 22,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyStartBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyStartGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyStartText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
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
