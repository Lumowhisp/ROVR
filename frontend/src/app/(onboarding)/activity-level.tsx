import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import * as Haptics from 'expo-haptics';

const LEVELS = [
  { id: 'sedentary', label: 'SEDENTARY', sub: 'Desk job, low daily movement' },
  { id: 'moderate', label: 'MODERATE', sub: 'Walking, light workouts 3–4×/week' },
  { id: 'active', label: 'ACTIVE', sub: 'Intense training or physical job' },
];

export default function ActivityLevelScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('active');

  const handleSelect = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelected(id);
  };

  const handleNext = () => {
    router.push('/(onboarding)/hydration-setup' as any);
  };

  return (
    <OnboardingShell
      step={7}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>How active are you?</Text>
      <Text style={styles.subtitle}>Helps ROVR calibrate your daily goals.</Text>

      <View style={styles.list}>
        {LEVELS.map((l) => {
          const isSel = selected === l.id;
          return (
            <TouchableOpacity
              key={l.id}
              activeOpacity={0.88}
              onPress={() => handleSelect(l.id)}
              style={[
                styles.card,
                isSel ? styles.cardSelected : styles.cardUnselected,
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={styles.levelLabel}>{l.label}</Text>
                {isSel && (
                  <View style={styles.radioOuter}>
                    <View style={styles.radioInner} />
                  </View>
                )}
              </View>
              <Text style={styles.levelSub}>{l.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    marginBottom: 24,
  },
  list: {
    gap: 14,
  },
  card: {
    padding: 22,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  cardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(155, 234, 32, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#242629',
    letterSpacing: 1,
  },
  levelSub: {
    fontSize: 13,
    color: '#687078',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#9BEA20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111214',
  },
});
