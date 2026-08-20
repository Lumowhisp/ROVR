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
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Bell, Search, Plus, Footprints, Bike, Compass, Mountain } from 'lucide-react-native';
import Svg, { Polygon } from 'react-native-svg';
import { ProgressRing } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { stepsAPI } from '@/services/api';
import { workoutStorage } from '@/services/workoutStorage';
import * as Haptics from 'expo-haptics';
import type { WorkoutSummary } from '@/types/workout';

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

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[new Date(timestamp).getDay()];
  }
  return `${days}d ago`;
}

interface GoalCardData {
  top: string;
  value: string;
  note: string;
  pct: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goalCards, setGoalCards] = useState<GoalCardData[]>([]);
  const [recentActivities, setRecentActivities] = useState<WorkoutSummary[]>([]);
  const [progressPct, setProgressPct] = useState(0);

  const displayName = user?.name ? user.name.split(' ')[0] : 'User';
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load local workout data
      const workouts = await workoutStorage.getAllWorkouts();
      setRecentActivities(workouts.slice(0, 5));

      // Try fetching backend data
      const [weeklyRes, streakRes, todayRes] = await Promise.allSettled([
        stepsAPI.getWeekly(),
        stepsAPI.getStreak(),
        stepsAPI.getToday(),
      ]);

      const cards: GoalCardData[] = [];

      // Weekly distance card
      if (weeklyRes.status === 'fulfilled' && weeklyRes.value?.data) {
        const weekData = weeklyRes.value.data;
        const totalDist = weekData.totalDistance ?? weekData.total_distance_km ?? 0;
        const goalPct = Math.min(Math.round((totalDist / 50) * 100), 100); // 50km weekly goal
        cards.push({
          top: 'This Week',
          value: `${totalDist.toFixed(1)} km`,
          note: `${goalPct}%`,
          pct: goalPct,
        });
      } else {
        // Fallback to local workout data
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const weekWorkouts = workouts.filter((w) => w.startTime >= weekAgo);
        const totalDist = weekWorkouts.reduce((s, w) => s + w.distanceKm, 0);
        const goalPct = Math.min(Math.round((totalDist / 50) * 100), 100);
        cards.push({
          top: 'This Week',
          value: `${totalDist.toFixed(1)} km`,
          note: `${goalPct}%`,
          pct: goalPct,
        });
      }

      // Streak card
      if (streakRes.status === 'fulfilled' && streakRes.value?.data) {
        const streakData = streakRes.value.data;
        const currentStreak = streakData.currentStreak ?? streakData.current ?? 0;
        const longestStreak = streakData.longestStreak ?? streakData.longest ?? 10;
        const streakPct = longestStreak > 0 ? Math.min(Math.round((currentStreak / longestStreak) * 100), 100) : 0;
        cards.push({
          top: 'Streak',
          value: `${currentStreak} Days`,
          note: currentStreak > 0 ? 'Keep it up!' : 'Start today!',
          pct: streakPct,
        });
      } else {
        cards.push({ top: 'Streak', value: '0 Days', note: 'Start today!', pct: 0 });
      }

      // Achievements card (local XP from workouts)
      const stats = await workoutStorage.getCumulativeStats();
      const xpPct = Math.min(Math.round((stats.totalXP / 2000) * 100), 100);
      cards.push({
        top: 'Total XP',
        value: `${stats.totalXP}`,
        note: `${stats.totalWorkouts} sessions`,
        pct: xpPct,
      });

      setGoalCards(cards);

      // Progress percentage from today's steps
      if (todayRes.status === 'fulfilled' && todayRes.value?.data) {
        const todayData = todayRes.value.data;
        const steps = todayData.steps ?? 0;
        const goal = todayData.goal_steps ?? 10000;
        setProgressPct(Math.min(Math.round((steps / goal) * 100), 100));
      } else {
        setProgressPct(0);
      }
    } catch (err) {
      console.log('Home data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleStartWorkout = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/(tracker)/workout' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Hello,</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <View style={styles.progressBadge}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="#9BEA20">
                      <Polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                    </Svg>
                    <Text style={styles.progressBadgeText}>Progress: {progressPct}%</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
              <Bell size={18} color="rgba(255, 255, 255, 0.45)" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>
                Preparing{'\n'}
                <Text style={styles.heroTitleItalic}>for the big move.</Text>
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleStartWorkout}
              style={styles.quickAddBtn}
            >
              <Plus size={24} color="#F7F8F9" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.searchPlaceholder}>Search activities, goals…</Text>
          </View>

          {/* Goal Crusher Carousel */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goal Crusher</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/progress' as any)}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#9BEA20" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalCarousel}
            >
              {goalCards.map((c, i) => (
                <View key={i} style={styles.goalCard}>
                  <View>
                    <Text style={styles.goalTop}>{c.top}</Text>
                    <Text style={styles.goalValue}>{c.value}</Text>
                  </View>
                  <View style={styles.goalBottomRow}>
                    <Text style={styles.goalNote}>{c.note}</Text>
                    <ProgressRing
                      size={46}
                      stroke={3.5}
                      progress={c.pct}
                      color="#9BEA20"
                      trackColor="rgba(255, 255, 255, 0.08)"
                    >
                      <Text style={styles.goalPctText}>{c.pct}%</Text>
                    </ProgressRing>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Recent Activities */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/activity-history' as any)}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#9BEA20" style={{ marginVertical: 20 }} />
          ) : recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workouts yet. Start your first one!</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recentActivities.map((a) => {
                const Icon = ACTIVITY_ICONS[a.activityType] || Footprints;
                const label = a.activityType.charAt(0).toUpperCase() + a.activityType.slice(1);
                return (
                  <View key={a.id} style={styles.activityItem}>
                    <View style={styles.activityIconWrap}>
                      <Icon size={18} color="rgba(255, 255, 255, 0.5)" />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityLabel}>{label}</Text>
                      <Text style={styles.activitySub}>{formatRelativeDate(a.startTime)}</Text>
                    </View>
                    <View style={styles.activityMetrics}>
                      <Text style={styles.activityDist}>{a.distanceKm.toFixed(1)} km</Text>
                      <Text style={styles.activityTime}>{formatDuration(a.durationSeconds)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <BottomNav active="home" />
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
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(155, 234, 32, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(155, 234, 32, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#9BEA20',
    fontSize: 14,
    fontWeight: '800',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(155, 234, 32, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  progressBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9BEA20',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9BEA20',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F7F8F9',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '900',
  },
  quickAddBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111214',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
    marginLeft: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  viewAllText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
  },
  goalCarousel: {
    gap: 12,
  },
  goalCard: {
    width: 148,
    height: 160,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    justifyContent: 'space-between',
  },
  goalTop: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  goalValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F7F8F9',
    marginTop: 2,
  },
  goalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  goalPctText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9BEA20',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.38)',
  },
  activityMetrics: {
    alignItems: 'flex-end',
  },
  activityDist: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.38)',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
  },
});
