import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/OnboardingShell';
import { GlassCard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 70 }, (_, i) => String(2015 - i));

export default function BirthDayScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [day, setDay] = useState('15');
  const [month, setMonth] = useState('Aug');
  const [year, setYear] = useState('1998');

  const handleNext = async () => {
    try {
      await updateUser({ dob: `${year}-${month}-${day}` });
    } catch {}
    router.push('/(onboarding)/HeightScreen/heightCard' as any);
  };

  const selectDay = (d: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setDay(d);
  };
  const selectMonth = (m: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setMonth(m);
  };
  const selectYear = (y: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setYear(y);
  };

  return (
    <OnboardingShell
      step={2}
      total={9}
      onNext={handleNext}
      nextLabel="Continue"
      light
    >
      <Text style={styles.title}>When were you born?</Text>
      <Text style={styles.subtitle}>We&apos;ll use this to personalize your metrics.</Text>

      <GlassCard dark={false} style={styles.pickerCard}>
        {/* Day Column */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>DAY</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
          >
            {DAYS.map((d) => {
              const isSelected = d === day;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => selectDay(d)}
                  style={[styles.itemWrap, isSelected && styles.itemWrapSelected]}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Month Column */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>MONTH</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
          >
            {MONTHS.map((m) => {
              const isSelected = m === month;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => selectMonth(m)}
                  style={[styles.itemWrap, isSelected && styles.itemWrapSelected]}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Year Column */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>YEAR</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
          >
            {YEARS.map((y) => {
              const isSelected = y === year;
              return (
                <TouchableOpacity
                  key={y}
                  onPress={() => selectYear(y)}
                  style={[styles.itemWrap, isSelected && styles.itemWrapSelected]}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </GlassCard>

      {/* Selected Preview Pill */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>
          Selected: <Text style={styles.previewBold}>{day} {month} {year}</Text>
        </Text>
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
  pickerCard: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    height: 280,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#687078',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  scrollList: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemWrap: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 3,
  },
  itemWrapSelected: {
    backgroundColor: 'rgba(155, 234, 32, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.5)',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#687078',
  },
  itemTextSelected: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111214',
  },
  previewBox: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  previewText: {
    fontSize: 14,
    color: '#687078',
  },
  previewBold: {
    fontWeight: '800',
    color: '#111214',
  },
});
