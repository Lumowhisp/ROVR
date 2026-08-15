import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  runOnUI,
} from 'react-native-reanimated';
import { Eye, EyeOff, Plus } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { signInWithSocialProvider, SocialProvider } from '@/lib/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ROVR Signature Color Palette
const LIME_GREEN = '#98E527';
const BG_DARK = '#08080C';
const CARD_BG = '#121218';
const INPUT_BG = '#16161E';
const BORDER_COLOR = '#232330';
const TEXT_MUTED = '#8E8E9F';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const buttonScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    if (!password) return 'Please create a password';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
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
          ?.message || 'Something went wrong. Please try again.';
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo / Avatar Badge with Plus indicator (matching reference) */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.badgeContainer}>
              <View style={styles.logoBadgeOuter}>
                <View style={styles.logoBadgeInner}>
                  <Image
                    source={require('@/assets/logo/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.plusBadge}>
                <Plus size={12} color="#000000" strokeWidth={3.5} />
              </View>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started with your dashboard.</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, shakeStyle]}>
            {/* Error Banner */}
            {error !== '' && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'name' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#5A5A6E"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'email' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#5A5A6E"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'password' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="Create a password"
                  placeholderTextColor="#5A5A6E"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#7E7E94" />
                  ) : (
                    <Eye size={19} color="#7E7E94" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  focusedField === 'confirmPassword' && styles.inputWrapFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#5A5A6E"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} color="#7E7E94" />
                  ) : (
                    <Eye size={19} color="#7E7E94" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Primary Sign Up Button */}
            <AnimatedPressable
              onPressIn={() => {
                'worklet';
                buttonScale.value = withSpring(0.97, { damping: 15 });
              }}
              onPressOut={() => {
                'worklet';
                buttonScale.value = withSpring(1, { damping: 15 });
              }}
              onPress={handleSignUp}
              disabled={loading}
              style={[styles.signUpBtn, buttonAnimStyle]}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.signUpBtnText}>Create Account</Text>
              )}
            </AnimatedPressable>

            {/* "Or" Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Icons Row */}
            <View style={styles.socialRow}>
              {/* Google */}
              <Pressable
                style={styles.socialBtn}
                onPress={() => handleSocialSignIn('google')}
                disabled={loading}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <Path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <Path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <Path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </Svg>
              </Pressable>

              {/* Apple */}
              <Pressable
                style={styles.socialBtn}
                onPress={() => handleSocialSignIn('apple')}
                disabled={loading}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                  <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.63-.78 1.06-1.85.94-2.93-.93.04-2.03.62-2.68 1.38-.58.66-1.08 1.74-.94 2.8 1.03.08 2.07-.49 2.68-1.25z" />
                </Svg>
              </Pressable>

              {/* Facebook */}
              <Pressable
                style={styles.socialBtn}
                onPress={() => handleSocialSignIn('facebook')}
                disabled={loading}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="#1877F2">
                  <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </Svg>
              </Pressable>
            </View>

            {/* Bottom Link */}
            <View style={styles.bottomSwitchRow}>
              <Text style={styles.switchPrompt}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.switchLink}>Sign In</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  logoBadgeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(152, 229, 39, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(152, 229, 39, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  plusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LIME_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG_DARK,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E0EC',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: LIME_GREEN,
    backgroundColor: '#181822',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  signUpBtn: {
    backgroundColor: LIME_GREEN,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: LIME_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  signUpBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_COLOR,
  },
  dividerText: {
    color: '#65657A',
    fontSize: 13,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 26,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CARD_BG,
    borderWidth: 1.2,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchPrompt: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  switchLink: {
    color: LIME_GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
});
