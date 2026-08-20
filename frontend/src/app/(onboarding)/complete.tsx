import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function CompleteScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const handleStart = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateUser({ isOnboarded: true });
    } catch {}
    router.replace('/(main)/home' as any);
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Athlete';

  return (
    <LinearGradient
      colors={['#1A1C2E', '#111214', '#0D1A0D']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Ambient Glow */}
        <View style={styles.ambientGlow} />

        <View style={styles.content}>
          {/* Main Success Circle */}
          <View style={styles.circleContainer}>
            <View style={styles.circleOuterAura} />
            <View style={styles.circleInner}>
              <View style={styles.checkIconWrap}>
                <Check size={30} color="#9BEA20" strokeWidth={3} />
              </View>
            </View>
            <View style={styles.readyPill}>
              <Text style={styles.readyPillText}>PROFILE READY</Text>
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>You&apos;re all set, {displayName}.</Text>
          <Text style={styles.subtitle}>
            Your personalized fitness profile is ready.
          </Text>

          {/* 3 Metric Cards */}
          <View style={styles.metricRow}>
            {[
              { label: 'BMI', value: user?.bmi || '21.4' },
              { label: 'LIMIT', value: '5/10' },
              { label: 'HYDRATION', value: 'ACTIVE' },
            ].map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <Text style={styles.metricVal}>{m.value}</Text>
                <Text style={styles.metricLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStart}
            style={styles.startBtn}
          >
            <Text style={styles.startBtnText}>Start Exploring ROVR →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    justifyContent: 'space-between',
  },
  ambientGlow: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(155, 234, 32, 0.08)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  circleOuterAura: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(155, 234, 32, 0.12)',
  },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(155, 234, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(155, 234, 32, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyPill: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#9BEA20',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  readyPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111214',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginBottom: 36,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
  },
  startBtn: {
    backgroundColor: '#9BEA20',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  startBtnText: {
    color: '#111214',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
