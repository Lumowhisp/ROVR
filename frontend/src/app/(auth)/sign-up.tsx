import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeInDown,
  runOnUI,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { signInWithSocialProvider, SocialProvider } from '@/lib/firebase';
import { GlassCard, GlassInput } from '@/components/ui';

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#1877F2">
      <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    runOnUI(() => {
      'worklet';
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    })();
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerShake();
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp(name.trim(), email.trim(), password);
      router.replace('/(onboarding)/gender' as any);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not create account. Please try again.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: SocialProvider) => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithSocialProvider(provider);
      if (res.success && res.user) {
        await updateUser({
          _id: res.user.uid,
          email: res.user.email || '',
          name: res.user.displayName || name || 'Athlete',
        });
        router.replace('/(onboarding)/gender' as any);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Social sign-up failed.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientTopRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.topLogoRow}>
              <View style={styles.smallLogoBadge}>
                <Text style={styles.smallLogoRV}>RV</Text>
              </View>
              <Text style={styles.smallBrandTitle}>ROVR</Text>
            </View>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.cardWrapper, shakeStyle]}>
            <GlassCard dark style={styles.authCard}>
              <Text style={styles.cardHeading}>Create your ROVR</Text>
              <Text style={styles.cardSubtitle}>Build your fitness profile.</Text>

              {error !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Name */}
              <View style={styles.inputContainer}>
                <GlassInput
                  placeholder="Full Name"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <GlassInput
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <GlassInput
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  rightAccessory={
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={12}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="rgba(255, 255, 255, 0.4)" />
                      ) : (
                        <Eye size={18} color="rgba(255, 255, 255, 0.4)" />
                      )}
                    </Pressable>
                  }
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <GlassInput
                  placeholder="Confirm Password"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
              </View>

              {/* CTA */}
              <Pressable
                onPress={handleSignUp}
                disabled={loading}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaButtonText}>Create Account</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignUp('google')}
                  disabled={loading}
                >
                  <GoogleIcon />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignUp('apple')}
                  disabled={loading}
                >
                  <AppleIcon />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignUp('facebook')}
                  disabled={loading}
                >
                  <FacebookIcon />
                </Pressable>
              </View>

              {/* Link */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                  <Text style={styles.switchLink}>Sign In</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111214',
  },
  flex: {
    flex: 1,
  },
  ambientTopRight: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(155, 234, 32, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  topLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(155, 234, 32, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLogoRV: {
    color: '#9BEA20',
    fontSize: 11,
    fontWeight: '900',
  },
  smallBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 354,
  },
  authCard: {
    padding: 24,
    borderRadius: 28,
  },
  cardHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 32, 0.35)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9BEA20',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    marginTop: 6,
    marginBottom: 18,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
  },
  switchLink: {
    fontSize: 12,
    color: '#9BEA20',
    fontWeight: '700',
  },
});
