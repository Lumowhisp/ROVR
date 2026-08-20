import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricPillProps {
  value: string | number;
  label: string;
  accent?: boolean;
}

export function MetricPill({ value, label, accent = false }: MetricPillProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, accent && styles.valueAccent]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F7F8F9',
  },
  valueAccent: {
    color: '#9BEA20',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
