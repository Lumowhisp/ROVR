import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';

interface GlassInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  rightAccessory?: React.ReactNode;
}

export function GlassInput({
  containerStyle,
  rightAccessory,
  style,
  placeholderTextColor = 'rgba(255, 255, 255, 0.3)',
  ...props
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        containerStyle,
      ]}
    >
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {rightAccessory && <View style={styles.accessory}>{rightAccessory}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: PlatformSelectPadding(),
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: 'rgba(155, 234, 32, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  input: {
    flex: 1,
    color: '#F7F8F9',
    fontSize: 15,
    padding: 0,
  },
  accessory: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function PlatformSelectPadding() {
  return 14;
}
