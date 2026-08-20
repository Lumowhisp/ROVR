import React, { ReactNode } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
}

export function LimeButton({
  children,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.limeButton,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#111214" />
      ) : typeof children === 'string' ? (
        <Text style={[styles.limeButtonText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export function DarkButton({
  children,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.darkButton,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#F7F8F9" />
      ) : typeof children === 'string' ? (
        <Text style={[styles.darkButtonText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  limeButton: {
    backgroundColor: '#9BEA20',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  limeButtonText: {
    color: '#111214',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  darkButton: {
    backgroundColor: 'rgba(17, 18, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
  },
  darkButtonText: {
    color: '#F7F8F9',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
