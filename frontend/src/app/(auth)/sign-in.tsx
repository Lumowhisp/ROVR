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
import { Eye, EyeOff, Check } from 'lucide-react-native';
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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, updateUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      triggerShake();
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace('/(onboarding)/gender' as any);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid credentials. Please try again.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: SocialProvider) => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithSocialProvider(provider);
      if (res.success && res.user) {
        await updateUser({
          _id: res.user.uid,
          email: res.user.email || '',
          name: res.user.displayName || 'Athlete',
        });
        router.replace('/(onboarding)/gender' as any);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Social sign-in failed.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtle background ambient orbs */}
      <View style={styles.ambientTopLeft} />
      <View style={styles.ambientBottomRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.logoSection}>
            <View style={styles.logoBadgeWrap}>
              <View style={styles.logoAura} />
              <View style={styles.logoBadge}>
                <Text style={styles.logoRV}>RV</Text>
              </View>
            </View>
            <Text style={styles.brandTitle}>ROVR</Text>
          </Animated.View>

          {/* Frosted Auth Card */}
          <Animated.View style={[styles.cardWrapper, shakeStyle]}>
            <GlassCard dark style={styles.authCard}>
              <Text style={styles.cardHeading}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Your next move starts here.</Text>

              {error !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email Input */}
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

              {/* Password Input */}
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

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && <Check size={11} color="#111214" strokeWidth={3.5} />}
                  </View>
                  <Text style={styles.rememberLabel}>Remember me</Text>
                </Pressable>

                <Pressable onPress={() => {}}>
                  <Text style={styles.forgotLabel}>Forgot Password?</Text>
                </Pressable>
              </View>

              {/* Sign In Primary CTA */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#F7F8F9" />
                ) : (
                  <Text style={styles.ctaButtonText}>Sign In</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignIn('google')}
                  disabled={loading}
                >
                  <GoogleIcon />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignIn('apple')}
                  disabled={loading}
                >
                  <AppleIcon />
                </Pressable>
                <Pressable
                  style={styles.socialBtn}
                  onPress={() => handleSocialSignIn('facebook')}
                  disabled={loading}
                >
                  <FacebookIcon />
                </Pressable>
              </View>

              {/* Switch to Sign Up */}
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don&apos;t have an account? </Text>
                <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                  <Text style={styles.switchLink}>Sign Up</Text>
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
  ambientTopLeft: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(155, 234, 32, 0.05)',
  },
  ambientBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(100, 120, 180, 0.06)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadgeWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoAura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(155, 234, 32, 0.18)',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(155, 234, 32, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(155, 234, 32, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRV: {
    color: '#9BEA20',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#9BEA20',
    borderColor: '#9BEA20',
  },
  rememberLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  forgotLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
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
