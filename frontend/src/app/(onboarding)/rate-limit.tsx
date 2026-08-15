import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Line, Circle } from "react-native-svg";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { onboardAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Arc Circle Parameters
// Center is placed at the bottom right so the arc bows towards top-left,
// calibrated so that step 1 (bottom left) and step 5 (top right) stay comfortably within screen bounds.
const CX = SCREEN_WIDTH * 1.18;
const CY = SCREEN_HEIGHT * 0.78;
const RADIUS = SCREEN_WIDTH * 1.06;

// 5 tick angles in degrees (from 1 to 5)
// 1 = bottom-left (~14% from left), 5 = top-right (~72% from left, safely inside screen)
const ANGLES = [172, 158, 144, 130, 116];

export default function RateLimitScreen() {
  const [rating, setRating] = useState(4);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuth();

  // Selected angle as shared value
  const initialAngle = ANGLES[3]; // default to 4 (index 3)
  const angleShared = useSharedValue(initialAngle);
  const scaleShared = useSharedValue(1);

  // Calculate coordinates along the arc for an angle in degrees
  const getPoint = (deg: number, r = RADIUS) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: CX + r * Math.cos(rad),
      y: CY - r * Math.sin(rad),
    };
  };

  // Precompute tick points
  const ticks = useMemo(() => {
    return ANGLES.map((deg, i) => {
      const pInner = getPoint(deg, RADIUS - 38);
      const pOuter = getPoint(deg, RADIUS + 38);
      const pOnArc = getPoint(deg, RADIUS);
      return { index: i + 1, deg, pInner, pOuter, pOnArc };
    });
  }, []);

  // Arc path string for SVG — extends slightly beyond tick 1 (172°) and tick 5 (116°)
  const arcPath = useMemo(() => {
    const start = getPoint(178);
    const end = getPoint(108);
    return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
  }, []);

  const triggerHapticAndState = (newRating: number) => {
    if (newRating !== rating) {
      setRating(newRating);
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  };

  const handleAngleUpdate = (rawAngle: number) => {
    "worklet";
    // Clamp angle within slider bounds
    const clamped = Math.max(ANGLES[4], Math.min(ANGLES[0], rawAngle));
    angleShared.value = clamped;

    // Find closest tick
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < ANGLES.length; i++) {
      const diff = Math.abs(ANGLES[i] - clamped);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    runOnJS(triggerHapticAndState)(closestIndex + 1);
  };

  const snapToClosest = () => {
    "worklet";
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < ANGLES.length; i++) {
      const diff = Math.abs(ANGLES[i] - angleShared.value);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    angleShared.value = withSpring(ANGLES[closestIndex], {
      damping: 18,
      stiffness: 120,
    });
    runOnJS(triggerHapticAndState)(closestIndex + 1);
  };

  // Pan gesture for dragging along the curve
  const panGesture = Gesture.Pan()
    .onStart(() => {
      scaleShared.value = withSpring(1.08, { damping: 12 });
    })
    .onUpdate((e) => {
      // Compute angle from touch point relative to (CX, CY)
      const touchX = e.x;
      const touchY = e.y;
      const dx = touchX - CX;
      const dy = CY - touchY; // inverted Y
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI;
      if (deg < 0) deg += 360;
      handleAngleUpdate(deg);
    })
    .onEnd(() => {
      scaleShared.value = withSpring(1);
      snapToClosest();
    });

  // Animated style for the reticle handle
  const handleAnimStyle = useAnimatedStyle(() => {
    const rad = (angleShared.value * Math.PI) / 180;
    const x = CX + RADIUS * Math.cos(rad);
    const y = CY - RADIUS * Math.sin(rad);

    return {
      transform: [
        { translateX: x - 55 },
        { translateY: y - 55 },
        { scale: scaleShared.value },
      ],
    };
  });

  const handleContinue = async () => {
    setLoading(true);
    try {
      const res = await onboardAPI.submitLimitRating(rating);
      if (res.success) {
        await updateUser({ limitRating: rating });
        router.push("/(onboarding)/hydration-setup" as any);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save limit rating.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your</Text>
        <Text style={styles.title}>Limit</Text>
      </View>

      {/* SVG Arc & Tick Dashes */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          {/* Main solid Arc Curve */}
          <Path
            d={arcPath}
            stroke="#DCDCDC"
            strokeWidth={4.5}
            fill="none"
            strokeLinecap="round"
          />

          {/* 5 Perpendicular Dashed Ticks */}
          {ticks.map((t) => (
            <Line
              key={t.index}
              x1={t.pInner.x}
              y1={t.pInner.y}
              x2={t.pOuter.x}
              y2={t.pOuter.y}
              stroke="#DCDCDC"
              strokeWidth={2}
              strokeDasharray="4, 4"
            />
          ))}
        </Svg>
      </View>

      {/* Gesture Zone for Draggable Slider Handle */}
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.reticleHandle, handleAnimStyle]}>
            <View style={styles.reticleOuter}>
              {/* Subtle Grid overlay */}
              <View style={styles.reticleGridLayer}>
                <View style={[styles.gridLine, { transform: [{ rotate: "0deg" }] }]} />
                <View style={[styles.gridLine, { transform: [{ rotate: "45deg" }] }]} />
                <View style={[styles.gridLine, { transform: [{ rotate: "90deg" }] }]} />
                <View style={[styles.gridLine, { transform: [{ rotate: "135deg" }] }]} />
              </View>

              {/* Arrow Indicator pointing up-right tangent */}
              <View style={styles.reticleInner}>
                <Svg width={52} height={52} viewBox="0 0 52 52">
                  <Path
                    d="M 16 24 L 32 26 L 29 42"
                    stroke="#D6EED0"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Circle cx="32" cy="26" r="3.5" fill="#D6EED0" />
                </Svg>
              </View>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Large Rating Number (bottom right) */}
      <View style={styles.numberContainer} pointerEvents="none">
        <Text style={styles.ratingNumber}>{rating}</Text>
      </View>

      {/* Direct Tap Selection Dots on bottom */}
      <View style={styles.tapRow}>
        {[1, 2, 3, 4, 5].map((val) => (
          <Pressable
            key={val}
            style={[styles.tapChip, rating === val && styles.tapChipActive]}
            onPress={() => {
              angleShared.value = withSpring(ANGLES[val - 1]);
              setRating(val);
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Text
              style={[
                styles.tapChipText,
                rating === val && styles.tapChipTextActive,
              ]}
            >
              {val}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.continueBtn, loading && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 28,
    paddingTop: 65,
    paddingBottom: 35,
    justifyContent: "space-between",
  },
  header: {
    alignSelf: "flex-start",
    zIndex: 10,
  },
  title: {
    fontSize: 46,
    fontWeight: "900",
    color: "#CCE2C8",
    letterSpacing: -0.5,
    lineHeight: 52,
    fontFamily: "System",
  },
  reticleHandle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  reticleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#C5E6C0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(197, 230, 192, 0.14)",
    shadowColor: "#72D55B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  reticleGridLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.35,
  },
  gridLine: {
    position: "absolute",
    width: "100%",
    height: 0.8,
    backgroundColor: "#C5E6C0",
  },
  reticleInner: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  numberContainer: {
    position: "absolute",
    bottom: 110,
    right: 32,
    zIndex: 5,
  },
  ratingNumber: {
    fontSize: 185,
    fontWeight: "900",
    color: "#72D55B",
    lineHeight: 195,
    letterSpacing: -4,
    fontFamily: "System",
  },
  tapRow: {
    flexDirection: "row",
    gap: 12,
    zIndex: 20,
    marginTop: "auto",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  tapChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  tapChipActive: {
    backgroundColor: "rgba(114, 213, 91, 0.2)",
    borderColor: "#72D55B",
  },
  tapChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
  },
  tapChipTextActive: {
    color: "#72D55B",
  },
  footer: {
    width: "100%",
    zIndex: 20,
  },
  continueBtn: {
    backgroundColor: "#72D55B",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#72D55B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  continueText: {
    color: "#050505",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
