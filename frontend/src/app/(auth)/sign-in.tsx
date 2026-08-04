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
  type StyleProp,
  type ViewStyle,
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
  type SharedValue,
} from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animations
  const buttonScale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const field1Anim = useSharedValue(0);
  const field2Anim = useSharedValue(0);
  const field3Anim = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animation
    field1Anim.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 90 }));
    field2Anim.value = withDelay(350, withSpring(1, { damping: 20, stiffness: 90 }));
    field3Anim.value = withDelay(500, withSpring(1, { damping: 20, stiffness: 90 }));

    // Pulsing logo glow
    const startGlow = () => {
      logoGlow.value = withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      );
    };
    startGlow();
    const interval = setInterval(startGlow, 4000);
    return () => clearInterval(interval);
  }, []);

  const makeFieldStyle = (animValue: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: animValue.value,
      transform: [
        { translateY: interpolate(animValue.value, [0, 1], [30, 0]) },
      ],
    }));

  const field1Style = makeFieldStyle(field1Anim);
  const field2Style = makeFieldStyle(field2Anim);
  const field3Style = makeFieldStyle(field3Anim);

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
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
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

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <LinearGradient
        colors={['#0A0A0F', '#0D0D1A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['#6C63FF20', '#6C63FF05', 'transparent']}
          style={[styles.orb, styles.orbTopRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['#00D4FF15', '#00D4FF05', 'transparent']}
          style={[styles.orb, styles.orbBottomLeft]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
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
            <Text style={styles.tagline}>Your Fitness Journey Starts Here</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, shakeStyle]}>
            <Animated.Text
              entering={FadeIn.delay(100).duration(500)}
              style={styles.formTitle}
            >
              Welcome Back
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(150).duration(500)}
              style={styles.formSubtitle}
            >
              Sign in to continue your journey
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

            {/* Email Input */}
            <Animated.View style={[styles.inputWrapper, field1Style]}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B728080"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View style={[styles.inputWrapper, field2Style]}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6B728080"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Sign In Button */}
            <Animated.View style={[field3Style, { marginTop: 8 }]}>
              <AnimatedPressable
                onPressIn={() => {
                  buttonScale.value = withSpring(0.97, { damping: 15 });
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1, { damping: 15 });
                }}
                onPress={handleSignIn}
                disabled={loading}
                style={buttonAnimStyle}
              >
                <LinearGradient
                  colors={loading ? ['#4A4580', '#0090B0'] : ['#6C63FF', '#00D4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeIn.delay(600).duration(500)}
              style={styles.dividerContainer}
            >
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View
              entering={FadeIn.delay(700).duration(500)}
              style={styles.switchContainer}
            >
              <Text style={styles.switchText}>Don't have an account? </Text>
              <Pressable
                onPress={() => router.push('/(auth)/sign-up')}
                disabled={loading}
              >
                <Text style={styles.switchLink}>Create Account</Text>
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
    paddingVertical: 60,
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
  orbTopRight: {
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.2,
  },
  orbBottomLeft: {
    bottom: -SCREEN_WIDTH * 0.3,
    left: -SCREEN_WIDTH * 0.3,
  },

  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: '#6C63FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 14,
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
    marginBottom: 32,
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
    marginBottom: 20,
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
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Button
  signInButton: {
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
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
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

  // Switch (sign up link)
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
