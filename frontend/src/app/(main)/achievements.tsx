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
import { ArrowLeft } from 'lucide-react-native';
import { ProgressRing } from '@/components/ui';

const ACHIEVEMENTS = [
  { label: 'FIRST 5K', desc: 'Completed first 5K run', emoji: '🏅', xp: 100, done: true },
  { label: '7 DAY STREAK', desc: 'Active 7 days in a row', emoji: '🔥', xp: 150, done: true },
  { label: '100 KM', desc: 'Total 100 km tracked', emoji: '💯', xp: 200, done: true },
  { label: 'HYDRATION HERO', desc: 'Hit water goal 5 days', emoji: '💧', xp: 75, done: false },
  { label: 'EARLY BIRD', desc: 'Workout before 7am', emoji: '🌅', xp: 50, done: false },
  { label: 'TRAIL EXPLORER', desc: 'Complete a trail hike', emoji: '⛰️', xp: 120, done: false },
];

export default function AchievementsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(main)/profile' as any)}
          >
            <ArrowLeft size={16} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* XP Progress Card */}
          <View style={styles.xpCard}>
            <ProgressRing
              size={72}
              stroke={5}
              progress={64}
              color="#9BEA20"
              trackColor="rgba(255, 255, 255, 0.08)"
            >
              <Text style={styles.levelNumber}>12</Text>
            </ProgressRing>

            <View style={styles.xpDetails}>
              <Text style={styles.xpLabel}>CURRENT LEVEL</Text>
              <Text style={styles.xpTotal}>1,840 XP</Text>
              <Text style={styles.xpRemaining}>160 XP to Level 13</Text>

              {/* Progress Bar */}
              <View style={styles.barTrack}>
                <View style={styles.barFill} />
              </View>
            </View>
          </View>

          {/* Badges Grid */}
          <View style={styles.grid}>
            {ACHIEVEMENTS.map((a) => (
              <View
                key={a.label}
                style={[
                  styles.badgeCard,
                  !a.done && styles.badgeCardLocked,
                ]}
              >
                <Text style={styles.badgeEmoji}>{a.emoji}</Text>
                <Text style={styles.badgeLabel}>{a.label}</Text>
                <Text style={styles.badgeDesc}>{a.desc}</Text>

                <View
                  style={[
                    styles.xpTag,
                    a.done ? styles.xpTagDone : styles.xpTagLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.xpTagText,
                      a.done ? styles.xpTagTextDone : styles.xpTagTextLocked,
                    ]}
                  >
                    +{a.xp} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 20,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 20,
  },
  levelNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#9BEA20',
  },
  xpDetails: {
    flex: 1,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.8,
  },
  xpTotal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F7F8F9',
    marginTop: 1,
  },
  xpRemaining: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  barFill: {
    width: '64%',
    height: '100%',
    backgroundColor: '#9BEA20',
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '48.3%',
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 2,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F7F8F9',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 13,
  },
  xpTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 4,
    borderWidth: 1,
  },
  xpTagDone: {
    backgroundColor: 'rgba(155, 234, 32, 0.12)',
    borderColor: 'rgba(155, 234, 32, 0.3)',
  },
  xpTagLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  xpTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  xpTagTextDone: {
    color: '#9BEA20',
  },
  xpTagTextLocked: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
