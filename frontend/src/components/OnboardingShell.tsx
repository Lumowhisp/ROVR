import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingShellProps {
  children: ReactNode;
  step: number;
  total?: number;
  onNext?: () => void;
  nextLabel?: string;
  light?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function OnboardingShell({
  children,
  step,
  total = 9,
  onNext,
  nextLabel = 'Continue',
  light = true,
  disabled = false,
  loading = false,
}: OnboardingShellProps) {
  const pct = Math.min(Math.max((step / total) * 100, 0), 100);

  const bgGradient = light
    ? (['#DDE2E7', '#C9D0D7', '#AEB7C0'] as const)
    : (['#25272A', '#1A1C1F', '#111214'] as const);

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar barStyle={light ? 'dark-content' : 'light-content'} translucent />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Progress Bar & Badge */}
        <View style={styles.topBar}>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>RV</Text>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
              ]}
            >
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text
              style={[
                styles.stepText,
                { color: light ? '#687078' : 'rgba(255,255,255,0.45)' },
              ]}
            >
              {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>{children}</View>

        {/* Bottom CTA */}
        {onNext && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onNext}
              disabled={disabled || loading}
              style={[
                styles.ctaBtn,
                {
                  backgroundColor: light ? '#111214' : '#9BEA20',
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.ctaBtnText,
                  { color: light ? '#F7F8F9' : '#111214' },
                ]}
              >
                {nextLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  badgeWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(155, 234, 32, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#9BEA20',
    fontSize: 9,
    fontWeight: '900',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9BEA20',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
  },
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
