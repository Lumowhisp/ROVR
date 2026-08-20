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
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Settings, ArrowLeft, Star, Crown, ArrowRight, Target, Trophy } from 'lucide-react-native';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { profileAPI, stepsAPI, hydrationAPI } from '@/services/api';
import { workoutStorage } from '@/services/workoutStorage';

const ACHIEVEMENTS_STRIP = [
  { label: 'First 5K', emoji: '🏅', done: true },
  { label: '7 Day Streak', emoji: '🔥', done: true },
  { label: '100 KM', emoji: '💯', done: true },
  { label: 'Hydration Hero', emoji: '💧', done: false },
  { label: 'Early Bird', emoji: '🌅', done: false },
];

interface ProfileData {
  totalDistance: string;
  totalActivities: string;
  monthlyGoal: string;
  achievements: string;
  bmi: string;
  weight: string;
  hydration: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    totalDistance: '--',
    totalActivities: '--',
    monthlyGoal: '--',
    achievements: '--',
    bmi: '--',
    weight: '--',
    hydration: '--',
  });

  const fullName = user?.name || 'User';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const data: ProfileData = {
        totalDistance: '--',
        totalActivities: '--',
        monthlyGoal: '--',
        achievements: '--',
        bmi: '--',
        weight: '--',
        hydration: '--',
      };

      // Fetch user profile from backend
      try {
        const meRes = await profileAPI.getMe();
        if (meRes?.data) {
          const u = meRes.data;
          data.bmi = u.bmi ? u.bmi.toFixed(1) : '--';
          data.weight = u.weight ? `${u.weight} kg` : '--';
        }
      } catch {
        // Fallback to auth context
        data.bmi = user?.bmi ? String(user.bmi) : '--';
        data.weight = user?.weight ? `${user.weight} kg` : '--';
      }

      // Fetch stats — try backend then local
      try {
        const statsRes = await stepsAPI.getStats();
        if (statsRes?.data) {
          const s = statsRes.data;
          data.totalDistance = `${(s.totalDistance ?? s.total_distance_km ?? 0).toFixed(1)} km`;
          data.totalActivities = `${s.totalActivities ?? s.totalDays ?? 0}`;
        }
      } catch {
        // Fallback to local
        const stats = await workoutStorage.getCumulativeStats();
        data.totalDistance = `${stats.totalDistanceKm.toFixed(1)} km`;
        data.totalActivities = `${stats.totalWorkouts}`;
      }

      // Monthly goal from local workouts
      const workouts = await workoutStorage.getAllWorkouts();
      const now = Date.now();
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      const monthWorkouts = workouts.filter((w) => w.startTime >= monthAgo);
      const monthDist = monthWorkouts.reduce((s, w) => s + w.distanceKm, 0);
      const monthGoalKm = 100; // 100km monthly goal
      data.monthlyGoal = `${Math.min(Math.round((monthDist / monthGoalKm) * 100), 100)}%`;

      // XP as achievements count
      const stats = await workoutStorage.getCumulativeStats();
      data.achievements = `${stats.totalXP}`;

      // Hydration
      try {
        const hydRes = await hydrationAPI.getToday();
        if (hydRes?.data) {
          data.hydration = `${(hydRes.data.consumed / 1000).toFixed(1)} L`;
        }
      } catch {
        data.hydration = '--';
      }

      setProfile(data);
    } catch (err) {
      console.log('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const trackingItems = [
    { label: 'Total Distance', value: profile.totalDistance, icon: ArrowRight },
    { label: 'Total Activities', value: profile.totalActivities, icon: Target },
    { label: 'Monthly Goal', value: profile.monthlyGoal, icon: Target },
    { label: 'Total XP', value: profile.achievements, icon: Trophy },
  ];

  const fitnessItems = [
    { label: 'BMI', value: profile.bmi },
    { label: 'Weight', value: profile.weight },
    { label: 'Hydration', value: profile.hydration },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/home' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/settings' as any)}
          >
            <Settings size={17} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#9BEA20" style={{ flex: 1 }} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                {/* Gold Star Badge */}
                <View style={styles.starBadge}>
                  <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.userName}>{fullName}</Text>

              {/* Active Crown Pill */}
              <View style={styles.activePill}>
                <Crown size={13} color="#F59E0B" />
                <Text style={styles.activePillText}>Active Member</Text>
              </View>
            </View>

            {/* Tracking Section */}
            <Text style={styles.sectionLabel}>TRACKING</Text>
            <View style={styles.trackingGrid}>
              {trackingItems.map((m) => {
                const Icon = m.icon;
                return (
                  <View key={m.label} style={styles.trackingCard}>
                    <View style={styles.trackingIconWrap}>
                      <Icon size={14} color="rgba(255, 255, 255, 0.4)" />
                    </View>
                    <View>
                      <Text style={styles.trackingLbl}>{m.label}</Text>
                      <Text style={styles.trackingVal}>{m.value}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Fitness Profile */}
            <Text style={styles.sectionLabel}>FITNESS PROFILE</Text>
            <View style={styles.fitnessRow}>
              {fitnessItems.map((m) => (
                <View key={m.label} style={styles.fitnessCard}>
                  <Text style={styles.fitnessVal}>{m.value}</Text>
                  <Text style={styles.fitnessLbl}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Achievements Strip Header */}
            <View style={styles.achievementsHeader}>
              <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
              <TouchableOpacity onPress={() => router.push('/(main)/achievements' as any)}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Achievements Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {ACHIEVEMENTS_STRIP.map((a) => (
                <View
                  key={a.label}
                  style={[
                    styles.achievementBadge,
                    !a.done && styles.achievementBadgeLocked,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{a.emoji}</Text>
                  <Text style={styles.achievementTitle} numberOfLines={2}>
                    {a.label}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </ScrollView>
        )}

        <BottomNav active="profile" />
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
    fontSize: 17,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E2025',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F7F8F9',
  },
  starBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#25272A',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F7F8F9',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  trackingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  trackingCard: {
    width: '48.3%',
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  trackingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trackingLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  trackingVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F7F8F9',
  },
  fitnessRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  fitnessCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  fitnessVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F7F8F9',
    marginBottom: 2,
  },
  fitnessLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9BEA20',
  },
  achievementsScroll: {
    gap: 8,
    paddingVertical: 8,
  },
  achievementBadge: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    gap: 6,
  },
  achievementBadgeLocked: {
    opacity: 0.4,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F7F8F9',
    textAlign: 'center',
    lineHeight: 12,
  },
});
