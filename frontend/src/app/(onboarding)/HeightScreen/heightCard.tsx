import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { GlassCard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const MARKERS = Array.from({ length: 91 }, (_, i) => 130 + i); // 130cm to 220cm

export default function HeightScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [cm, setCm] = useState(172);
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');

  const handleNext = async () => {
    try {
      await updateUser({ height: cm });
    } catch {}
    router.push('/(onboarding)/WeightScreen/Weight' as any);
  };

  const handleSelectCm = (val: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setCm(val);
  };

  const displayVal =
    unit === 'cm'
      ? `${cm}`
      : `${Math.floor(cm / 30.48)}'${Math.round((cm % 30.48) / 2.54)}"`;

  return (
    <OnboardingShell
      step={3}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>How tall are you?</Text>
      <Text style={styles.subtitle}>Select your height to calibrate step cadence.</Text>

      {/* Unit Toggle */}
      <View style={styles.unitToggleRow}>
        <View style={styles.unitToggle}>
          {(['cm', 'ft'] as const).map((u) => {
            const isSel = unit === u;
            return (
              <TouchableOpacity
                key={u}
                activeOpacity={0.85}
                onPress={() => setUnit(u)}
                style={[styles.unitBtn, isSel && styles.unitBtnActive]}
              >
                <Text style={[styles.unitBtnText, isSel && styles.unitBtnTextActive]}>
                  {u.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Big Number Display */}
      <View style={styles.bigMetricRow}>
        <Text style={styles.bigMetricValue}>{displayVal}</Text>
        <Text style={styles.bigMetricUnit}>{unit}</Text>
      </View>

      {/* Ruler Card */}
      <GlassCard dark={false} style={styles.rulerCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rulerScroll}
        >
          {MARKERS.map((m) => {
            const active = m === cm;
            const isMajor = m % 5 === 0;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => handleSelectCm(m)}
                style={styles.tickBtn}
              >
                <View
                  style={[
                    styles.tickLine,
                    {
                      height: active ? 52 : isMajor ? 36 : 22,
                      width: active ? 4 : 2,
                      backgroundColor: active ? '#9BEA20' : isMajor ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
                      borderRadius: active ? 2 : 1,
                    },
                  ]}
                />
                {isMajor && (
                  <Text style={[styles.tickLabel, active && styles.tickLabelActive]}>
                    {m}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  unitToggleRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderRadius: 16,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 13,
  },
  unitBtnActive: {
    backgroundColor: '#111214',
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#687078',
  },
  unitBtnTextActive: {
    color: '#F7F8F9',
  },
  bigMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 28,
    gap: 8,
  },
  bigMetricValue: {
    fontSize: 68,
    fontWeight: '900',
    color: '#242629',
    lineHeight: 70,
  },
  bigMetricUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#687078',
    marginBottom: 8,
  },
  rulerCard: {
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  rulerScroll: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  tickBtn: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tickLine: {
    marginBottom: 6,
  },
  tickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E959D',
  },
  tickLabelActive: {
    color: '#111214',
    fontWeight: '800',
  },
});