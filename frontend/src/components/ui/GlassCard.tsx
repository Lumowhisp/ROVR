import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
  onPress?: () => void;
  intensity?: number;
  borderRadius?: number;
}

export function GlassCard({
  children,
  style,
  dark = true,
  onPress,
  intensity = 20,
  borderRadius = 24,
}: GlassCardProps) {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      borderRadius,
      backgroundColor: dark ? 'rgba(17, 18, 20, 0.72)' : 'rgba(255, 255, 255, 0.35)',
      borderColor: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.45)',
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[containerStyle, styles.touchable]}
      >
        {Platform.OS !== 'android' ? (
          <BlurView
            intensity={intensity}
            tint={dark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
        ) : null}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {Platform.OS !== 'android' ? (
        <BlurView
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 3,
  },
  touchable: {
    // Additional touch styling if needed
  },
});
