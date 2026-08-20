import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { GlassCard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { Plus, Minus } from 'lucide-react-native';

const WEIGHT_LIST = Array.from({ length: 141 }, (_, i) => 35 + i); // 35kg to 175kg

export default function WeightScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [kg, setKg] = useState(70);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const handleNext = async () => {
    try {
      await updateUser({ weight: kg });
    } catch {}
    router.push('/(onboarding)/bmi-result' as any);
  };

  const adjustKg = (delta: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setKg((prev) => Math.min(Math.max(prev + delta, 35), 180));
  };

  const selectWeight = (val: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setKg(val);
  };

  const displayVal =
    unit === 'kg' ? `${kg.toFixed(1)}` : `${(kg * 2.205).toFixed(1)}`;

  return (
    <OnboardingShell
      step={4}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>What&apos;s your current weight?</Text>
      <Text style={styles.subtitle}>We&apos;ll track your progress over time.</Text>

      {/* Unit Toggle */}
      <View style={styles.unitToggleRow}>
        <View style={styles.unitToggle}>
          {(['kg', 'lb'] as const).map((u) => {
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

      {/* Big Metric Display & Steppers */}
      <View style={styles.metricRow}>
        <TouchableOpacity
          onPress={() => adjustKg(-0.5)}
          style={styles.stepperBtn}
        >
          <Minus size={20} color="#111214" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.metricCenter}>
          <Text style={styles.bigMetricValue}>{displayVal}</Text>
          <Text style={styles.bigMetricUnit}>{unit}</Text>
        </View>

        <TouchableOpacity
          onPress={() => adjustKg(0.5)}
          style={styles.stepperBtn}
        >
          <Plus size={20} color="#111214" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Weight Selector Carousel */}
      <GlassCard dark={false} style={styles.weightCard}>
        <Text style={styles.cardHeader}>SCROLL OR TAP TO SELECT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {WEIGHT_LIST.map((w) => {
            const isSel = Math.round(kg) === w;
            return (
              <TouchableOpacity
                key={w}
                onPress={() => selectWeight(w)}
                style={[styles.weightPill, isSel && styles.weightPillSelected]}
              >
                <Text style={[styles.weightPillText, isSel && styles.weightPillTextSelected]}>
                  {unit === 'kg' ? w : Math.round(w * 2.205)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </GlassCard>

      <Text style={styles.footerNote}>
        This helps ROVR calculate active calorie burn accurately.
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
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  metricCenter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bigMetricValue: {
    fontSize: 64,
    fontWeight: '900',
    color: '#242629',
    lineHeight: 68,
  },
  bigMetricUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#687078',
    marginBottom: 8,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  weightCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#687078',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  weightPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weightPillSelected: {
    backgroundColor: '#9BEA20',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  weightPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#687078',
  },
  weightPillTextSelected: {
    color: '#111214',
    fontWeight: '900',
  },
  footerNote: {
    fontSize: 13,
    color: '#687078',
    textAlign: 'center',
    marginTop: 20,
  },
});