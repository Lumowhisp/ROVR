import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { GlassCard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import Svg, { Path, Line, Circle } from 'react-native-svg';

export default function BMIScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const heightM = (user?.height || 172) / 100;
  const weightKg = user?.weight || 70;
  const bmiVal = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  const pct = Math.min(Math.max(((bmiVal - 15) / (35 - 15)) * 100, 0), 100);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
    if (bmi <= 24.9) return { label: 'Healthy Range · 18.5 — 24.9', color: '#15803D', bg: 'rgba(74, 222, 128, 0.2)' };
    if (bmi <= 29.9) return { label: 'Overweight', color: '#D97706', bg: 'rgba(251, 191, 36, 0.2)' };
    return { label: 'Obese', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.2)' };
  };

  const category = getBMICategory(bmiVal);

  const handleNext = async () => {
    try {
      await updateUser({ bmi: bmiVal });
    } catch {}
    router.push('/(onboarding)/goal' as any);
  };

  // Needle angle in radians (-PI to 0)
  const angle = Math.PI + (pct / 100) * Math.PI;
  const needleX2 = 120 + 70 * Math.cos(angle);
  const needleY2 = 120 + 70 * Math.sin(angle);

  return (
    <OnboardingShell
      step={5}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>Your Body Profile</Text>
      <Text style={styles.subtitle}>Based on your height and weight.</Text>

      {/* Semi-circle Gauge Card */}
      <GlassCard dark={false} style={styles.gaugeCard}>
        <View style={styles.svgContainer}>
          <Svg width={240} height={130} viewBox="0 0 240 130">
            {/* Background Arc Segments */}
            <Path d="M 30 120 A 90 90 0 0 1 80 38" fill="none" stroke="#60A5FA" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
            <Path d="M 80 38 A 90 90 0 0 1 160 38" fill="none" stroke="#4ADE80" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
            <Path d="M 160 38 A 90 90 0 0 1 210 120" fill="none" stroke="#FBBF24" strokeWidth={10} strokeLinecap="round" opacity={0.3} />

            {/* Active Highlight Arc */}
            <Path d="M 80 38 A 90 90 0 0 1 160 38" fill="none" stroke="#4ADE80" strokeWidth={12} strokeLinecap="round" opacity={0.9} />

            {/* Needle */}
            <Line x1="120" y1="120" x2={needleX2} y2={needleY2} stroke="#242629" strokeWidth={3} strokeLinecap="round" />
            <Circle cx="120" cy="120" r="7" fill="#242629" />
          </Svg>

          <View style={styles.bmiValueCenter}>
            <Text style={styles.bmiNumber}>{bmiVal}</Text>
            <Text style={styles.bmiLabel}>BMI</Text>
          </View>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: category.bg }]}>
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.label}
          </Text>
        </View>
      </GlassCard>

      {/* 3 Metric Cards */}
      <View style={styles.metricCardsRow}>
        <GlassCard dark={false} style={styles.metricCard}>
          <Text style={styles.metricValue}>{weightKg} kg</Text>
          <Text style={styles.metricLabel}>Weight</Text>
        </GlassCard>
        <GlassCard dark={false} style={styles.metricCard}>
          <Text style={styles.metricValue}>{user?.height || 172} cm</Text>
          <Text style={styles.metricLabel}>Height</Text>
        </GlassCard>
        <GlassCard dark={false} style={styles.metricCard}>
          <Text style={styles.metricValue}>{bmiVal}</Text>
          <Text style={styles.metricLabel}>BMI</Text>
        </GlassCard>
      </View>

      <Text style={styles.footerNote}>
        Your current BMI is calibrated for healthy metabolic workouts.
      </Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#242629',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#687078',
    marginBottom: 20,
  },
  gaugeCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 16,
  },
  svgContainer: {
    width: 240,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bmiValueCenter: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  bmiNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#242629',
    lineHeight: 40,
  },
  bmiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#687078',
    letterSpacing: 1.5,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#242629',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#687078',
  },
  footerNote: {
    fontSize: 13,
    color: '#687078',
    textAlign: 'center',
  },
});
