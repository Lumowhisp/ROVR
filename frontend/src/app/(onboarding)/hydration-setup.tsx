import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { GlassCard, ProgressRing } from '@/components/ui';

export default function HydrationSetupScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/complete' as any);
  };

  const scheduleRows = [
    { label: 'Wake Time', value: '07:00' },
    { label: 'Sleep Time', value: '23:00' },
    { label: 'Activity Level', value: 'Active' },
  ];

  return (
    <OnboardingShell
      step={8}
      total={9}
      onNext={handleNext}
      nextLabel="Build My Plan"
      light
    >
      <Text style={styles.title}>Your Hydration Plan</Text>
      <Text style={styles.subtitle}>
        ROVR builds your daily hydration target around your routine.
      </Text>

      <GlassCard dark={false} style={styles.card}>
        <Text style={styles.headerLabel}>DAILY HYDRATION</Text>

        {/* Circular Water Gauge */}
        <View style={styles.gaugeSection}>
          <ProgressRing
            size={144}
            stroke={10}
            progress={78}
            color="#22D3EE"
            trackColor="rgba(34, 211, 238, 0.12)"
          >
            <View style={styles.gaugeInner}>
              <Text style={styles.gaugeNumber}>2.8</Text>
              <Text style={styles.gaugeUnit}>L / day</Text>
            </View>
          </ProgressRing>
          <Text style={styles.targetLabel}>Daily Target</Text>
        </View>

        {/* Routine Breakdown */}
        <View style={styles.rowsList}>
          {scheduleRows.map((r) => (
            <View key={r.label} style={styles.scheduleRow}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
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
  card: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#687078',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 12,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gaugeInner: {
    alignItems: 'center',
  },
  gaugeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0891B2',
    lineHeight: 38,
  },
  gaugeUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#687078',
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#687078',
    marginTop: 8,
  },
  rowsList: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.18)',
  },
  rowLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111214',
  },
});
