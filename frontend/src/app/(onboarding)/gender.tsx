import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function GenderScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [selected, setSelected] = useState<string>('male');

  const options = [
    { id: 'male', label: 'Male', icon: '♂' },
    { id: 'female', label: 'Female', icon: '♀' },
    { id: 'other', label: 'Prefer not to say', icon: '◈' },
  ];

  const handleSelect = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelected(id);
  };

  const handleNext = async () => {
    try {
      await updateUser({ gender: selected });
    } catch {}
    router.push('/(onboarding)/BirthdayScreen/BirthDay' as any);
  };

  return (
    <OnboardingShell
      step={1}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>Tell us about you.</Text>
      <Text style={styles.subtitle}>This helps ROVR personalize your experience.</Text>

      <View style={styles.optionsList}>
        {options.map((o) => {
          const isSel = selected === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              activeOpacity={0.88}
              onPress={() => handleSelect(o.id)}
              style={[
                styles.optionCard,
                isSel ? styles.optionCardSelected : styles.optionCardUnselected,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isSel ? 'rgba(155, 234, 32, 0.15)' : 'rgba(0, 0, 0, 0.06)' },
                ]}
              >
                <Text style={styles.iconText}>{o.icon}</Text>
              </View>

              <Text style={[styles.optionLabel, { color: isSel ? '#242629' : '#687078' }]}>
                {o.label}
              </Text>

              <View
                style={[
                  styles.radioOuter,
                  isSel && styles.radioOuterSelected,
                ]}
              >
                {isSel && <View style={styles.radioInner} />}
              </View>
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
    marginBottom: 28,
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(155, 234, 32, 0.5)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  optionCardUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#242629',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    backgroundColor: '#9BEA20',
    borderColor: '#9BEA20',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111214',
  },
});