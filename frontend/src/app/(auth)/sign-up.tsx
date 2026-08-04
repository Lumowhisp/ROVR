import { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  runOnUI,
} from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const buttonScale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const field1Anim = useSharedValue(0);
  const field2Anim = useSharedValue(0);
  const field3Anim = useSharedValue(0);
  const field4Anim = useSharedValue(0);
  const field5Anim = useSharedValue(0);

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      field1Anim.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 90 }));
      field2Anim.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 90 }));
      field3Anim.value = withDelay(400, withSpring(1, { damping: 20, stiffness: 90 }));
      field4Anim.value = withDelay(500, withSpring(1, { damping: 20, stiffness: 90 }));
      field5Anim.value = withDelay(600, withSpring(1, { damping: 20, stiffness: 90 }));
    })();

    const startGlow = () => {
      runOnUI(() => {
        'worklet';
        logoGlow.value = withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        );
      })();
    };
    startGlow();
    const interval = setInterval(startGlow, 4000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Each animated style is a direct top-level hook call (Rules of Hooks compliant)
  const f1Style = useAnimatedStyle(() => ({
    opacity: field1Anim.value,
    transform: [{ translateY: interpolate(field1Anim.value, [0, 1], [30, 0]) }],
  }));
  const f2Style = useAnimatedStyle(() => ({
    opacity: field2Anim.value,
    transform: [{ translateY: interpolate(field2Anim.value, [0, 1], [30, 0]) }],
  }));
  const f3Style = useAnimatedStyle(() => ({
    opacity: field3Anim.value,
    transform: [{ translateY: interpolate(field3Anim.value, [0, 1], [30, 0]) }],
  }));
  const f4Style = useAnimatedStyle(() => ({
    opacity: field4Anim.value,
    transform: [{ translateY: interpolate(field4Anim.value, [0, 1], [30, 0]) }],
  }));
  const f5Style = useAnimatedStyle(() => ({
    opacity: field5Anim.value,
    transform: [{ translateY: interpolate(field5Anim.value, [0, 1], [30, 0]) }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoGlow.value, [0, 1], [0.3, 1]),
    textShadowRadius: interpolate(logoGlow.value, [0, 1], [0, 20]),
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

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (!email.trim()) return 'Please enter your email';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email';

    if (!password) return 'Please enter a password';
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
      router.replace('/(tabs)');
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

  const handlePressIn = () => {
    runOnUI(() => {
      'worklet';
      buttonScale.value = withSpring(0.97, { damping: 15 });
    })();
  };

  const handlePressOut = () => {
    runOnUI(() => {
      'worklet';
      buttonScale.value = withSpring(1, { damping: 15 });
    })();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#0D0D1A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['#00D4FF15', '#00D4FF05', 'transparent']}
          style={[styles.orb, styles.orbTopLeft]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
        <LinearGradient
          colors={['#6C63FF20', '#6C63FF05', 'transparent']}
          style={[styles.orb, styles.orbBottomRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Branding */}
          <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.brandingContainer}
          >
            <Animated.Text style={[styles.logoText, logoGlowStyle]}>
              ROVR
            </Animated.Text>
            <Text style={styles.tagline}>Unleash Your Potential</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, shakeStyle]}>
            <Animated.Text
              entering={FadeIn.delay(100).duration(500)}
              style={styles.formTitle}
            >
              Create Account
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(150).duration(500)}
              style={styles.formSubtitle}
            >
              Join ROVR and transform your fitness
            </Animated.Text>

            {/* Error Message */}
            {error !== '' && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.errorContainer}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Full Name */}
            <Animated.View style={[styles.inputWrapper, f1Style]}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, focusedField === 'name' && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#6B728080"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View style={[styles.inputWrapper, f2Style]}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, focusedField === 'email' && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B728080"
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
            </Animated.View>

            {/* Password */}
            <Animated.View style={[styles.inputWrapper, f3Style]}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, focusedField === 'password' && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6B728080"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Confirm Password */}
            <Animated.View style={[styles.inputWrapper, f4Style]}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, focusedField === 'confirmPassword' && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6B728080"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Password hint */}
            <Animated.View style={f4Style}>
              <Text style={styles.passwordHint}>
                Must be at least 6 characters
              </Text>
            </Animated.View>

            {/* Sign Up Button */}
            <Animated.View style={[f5Style, { marginTop: 8 }]}>
              <AnimatedPressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSignUp}
                disabled={loading}
                style={buttonAnimStyle}
              >
                <LinearGradient
                  colors={loading ? ['#4A4580', '#0090B0'] : ['#6C63FF', '#00D4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signUpButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeIn.delay(700).duration(500)}
              style={styles.dividerContainer}
            >
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Sign In Link */}
            <Animated.View
              entering={FadeIn.delay(800).duration(500)}
              style={styles.switchContainer}
            >
              <Text style={styles.switchText}>Already have an account? </Text>
              <Pressable onPress={() => router.back()} disabled={loading}>
                <Text style={styles.switchLink}>Sign In</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  orbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  orbTopLeft: {
    top: -SCREEN_WIDTH * 0.3,
    left: -SCREEN_WIDTH * 0.2,
  },
  orbBottomRight: {
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
  },

  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: '#6C63FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Form
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },

  // Error
  errorContainer: {
    backgroundColor: '#FF4D6A15',
    borderWidth: 1,
    borderColor: '#FF4D6A30',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4D6A',
    fontSize: 13,
    fontWeight: '500',
  },

  // Input
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B0B4BA',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: '#1E1E2E',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: '#6C63FF60',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Password hint
  passwordHint: {
    fontSize: 12,
    color: '#6B728090',
    marginTop: -10,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Button
  signUpButton: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E1E2E',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 13,
    marginHorizontal: 16,
  },

  // Switch (sign in link)
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchLink: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '700',
  },
});
