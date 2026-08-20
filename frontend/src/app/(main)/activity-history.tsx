import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Footprints, Bike, Compass, Mountain, ArrowLeft } from 'lucide-react-native';
import BottomNav from '@/components/BottomNav';
import { workoutStorage } from '@/services/workoutStorage';
import type { WorkoutSummary, ActivityType } from '@/types/workout';
import * as Haptics from 'expo-haptics';

const FILTERS = ['All', 'Running', 'Cycling', 'Walking', 'Hiking'];

const ACTIVITY_ICONS: Record<string, typeof Footprints> = {
  running: Footprints,
  cycling: Bike,
  walking: Compass,
  hiking: Mountain,
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const daysAgo = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workoutStorage.getAllWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.log('Error loading workout history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const handleSelectFilter = (f: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setFilter(f);
  };

  const filtered = filter === 'All'
    ? workouts
    : workouts.filter((w) => w.activityType.toLowerCase() === filter.toLowerCase());

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/activity-feed' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity History</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Filter Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isSel = filter === f;
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.85}
                onPress={() => handleSelectFilter(f)}
                style={[
                  styles.filterChip,
                  isSel ? styles.filterChipActive : styles.filterChipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSel ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Activities List */}
        {loading ? (
          <ActivityIndicator color="#9BEA20" style={{ flex: 1 }} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {filter === 'All' ? 'No activities recorded yet.' : `No ${filter.toLowerCase()} sessions found.`}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filtered.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.activityType] || Footprints;
                  const label = a.activityType.charAt(0).toUpperCase() + a.activityType.slice(1);
                  return (
                    <View key={a.id} style={styles.card}>
                      <View style={styles.iconWrap}>
                        <Icon size={18} color="rgba(255, 255, 255, 0.5)" />
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.cardLabel}>{label}</Text>
                        <Text style={styles.cardSub}>{formatDate(a.startTime)} · {a.caloriesBurned} kcal</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.cardDist}>{a.distanceKm.toFixed(1)} km</Text>
                        <Text style={styles.cardTime}>{formatDuration(a.durationSeconds)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        <BottomNav active="activity" />
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
    paddingVertical: 14,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#F7F8F9',
  },
  filterChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#111214',
  },
  filterChipTextInactive: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 110,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  metricCol: {
    alignItems: 'flex-end',
  },
  cardDist: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
