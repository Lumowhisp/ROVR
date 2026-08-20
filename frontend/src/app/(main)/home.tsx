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
import { useRouter } from 'expo-router';
import { Bell, Search, Plus, Footprints, Bike } from 'lucide-react-native';
import Svg, { Polygon } from 'react-native-svg';
import { ProgressRing } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const GOAL_CARDS = [
  { top: 'This Week', value: '42.2 km', note: '12%', pct: 72 },
  { top: 'Streak', value: '7 Days', note: 'Keep it up!', pct: 70 },
  { top: 'Achievements', value: '24', note: '+2 this week', pct: 55 },
];

const RECENT_ACTIVITIES = [
  { id: '1', type: 'run', label: 'Ran', sub: 'Today', dist: '8.8 km', time: '45:32', icon: Footprints },
  { id: '2', type: 'cycle', label: 'Cycle', sub: 'Yesterday', dist: '24.5 km', time: '1:12:15', icon: Bike },
  { id: '3', type: 'run', label: 'Ran', sub: 'Mon', dist: '5.2 km', time: '28:44', icon: Footprints },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.name ? user.name.split(' ')[0] : 'Ankit';
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AS';

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
                    <Text style={styles.progressBadgeText}>Progress: 75%</Text>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalCarousel}
          >
            {GOAL_CARDS.map((c, i) => (
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

          {/* Recent Activities */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/activity-history' as any)}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {RECENT_ACTIVITIES.map((a) => {
              const Icon = a.icon;
              return (
                <View key={a.id} style={styles.activityItem}>
                  <View style={styles.activityIconWrap}>
                    <Icon size={18} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLabel}>{a.label}</Text>
                    <Text style={styles.activitySub}>{a.sub}</Text>
                  </View>
                  <View style={styles.activityMetrics}>
                    <Text style={styles.activityDist}>{a.dist}</Text>
                    <Text style={styles.activityTime}>{a.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
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
});
