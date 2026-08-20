import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import * as Haptics from 'expo-haptics';

const GOALS = [
  { id: 'lose', label: 'Lose Weight', icon: '↓', desc: 'Burn fat, feel lighter' },
  { id: 'muscle', label: 'Build Muscle', icon: '⚡', desc: 'Strength and definition' },
  { id: 'endurance', label: 'Improve Endurance', icon: '∞', desc: 'Run longer, go further' },
  { id: 'active', label: 'Stay Active', icon: '◉', desc: 'Consistent daily movement' },
  { id: 'fitness', label: 'General Fitness', icon: '✦', desc: 'Balanced overall health' },
];

export default function GoalScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('endurance');

  const handleSelect = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelected(id);
  };

  const handleNext = () => {
    router.push('/(onboarding)/activity-level' as any);
  };

  return (
    <OnboardingShell
      step={6}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>What drives you?</Text>
      <Text style={styles.subtitle}>Choose what you want ROVR to optimize for.</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {GOALS.map((g) => {
          const isSel = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              activeOpacity={0.88}
              onPress={() => handleSelect(g.id)}
              style={[
                styles.card,
                isSel ? styles.cardSelected : styles.cardUnselected,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isSel ? 'rgba(155, 234, 32, 0.18)' : 'rgba(0, 0, 0, 0.06)' },
                ]}
              >
                <Text style={styles.iconText}>{g.icon}</Text>
              </View>

              <View style={styles.textWrap}>
                <Text style={[styles.cardTitle, isSel && styles.cardTitleSelected]}>
                  {g.label}
                </Text>
                <Text style={styles.cardDesc}>{g.desc}</Text>
              </View>

              {isSel && (
                <View style={styles.radioOuter}>
                  <View style={styles.radioInner} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  cardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(155, 234, 32, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#242629',
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: '#242629',
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
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
