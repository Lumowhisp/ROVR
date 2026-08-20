import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import TomTomMap, { type TomTomMapHandle } from '@/components/map/TomTomMap';
import type { SafeRouteData } from '@/components/map/mapBridge';
import { roadsAPI } from '@/services/api';
import {
  Play,
  Pause,
  Square,
  Navigation,
  Flame,
  Zap,
  CheckCircle2,
  ArrowLeft,
  Footprints,
  Bike,
  Compass,
  Mountain,
  ShieldCheck,
  Layers,
  Sparkles,
  X,
  Timer,
} from 'lucide-react-native';
import Animated, {
  ZoomIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { ActivityType, LocationCoordinate, WorkoutSummary } from '@/types/workout';
import {
  calculateHaversineDistance,
  formatDuration,
  formatPace,
  calculateCalories,
  calculateWorkoutXP,
  getCurrentTimestamp,
  generateWorkoutId,
} from '@/lib/geo';
import { workoutStorage } from '@/services/workoutStorage';
import { stepCounterService } from '@/services/stepCounter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    activityType?: ActivityType;
    targetDistance?: string;
  }>();
  const activityType: ActivityType = params.activityType || 'running';
  const targetDistanceKm = parseFloat(params.targetDistance || '0') || 0;

  // Tracking state
  const [trackingStatus, setTrackingStatus] = useState<'idle' | 'active' | 'paused' | 'finished'>('idle');
  const [coordinates, setCoordinates] = useState<LocationCoordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinate | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState(0);
  const [followUser, setFollowUser] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Safety Routing & Roads state
  const [recommendedRoute, setRecommendedRoute] = useState<SafeRouteData | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false);
  const [roadSegmentsGeoJSON, setRoadSegmentsGeoJSON] = useState<any | null>(null);
  const [selectedRoadInfo, setSelectedRoadInfo] = useState<{
    segmentId: string;
    roadName: string;
    safetyScore: number;
    trafficLevel: number | null;
  } | null>(null);

  const mapRef = useRef<TomTomMapHandle | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMovementTimestamp = useRef<number>(0);

  // Breathing live pulse animation
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.25, { duration: 1000 }),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Timer helpers
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    lastMovementTimestamp.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Auto zero-decay speed if stationary for more than 2 seconds
      if (lastMovementTimestamp.current > 0 && Date.now() - lastMovementTimestamp.current > 2000) {
        setCurrentSpeedKmH(0);
      }
    }, 1000);
  };

  const stopGPSWatch = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setCurrentSpeedKmH(0);
  };

  // Live GPS watching with Kalman-grade noise filtering
  const startGPSWatch = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2.0, // 2-meter minimum movement threshold
        },
        (loc) => {
          const accuracy = loc.coords.accuracy;
          // Filter out low-accuracy cell tower fixes (> 20 meters error radius)
          if (accuracy !== null && accuracy !== undefined && accuracy > 20) {
            return;
          }

          const newCoord: LocationCoordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            timestamp: loc.timestamp || Date.now(),
          };

          setCurrentLocation(newCoord);

          // Calculate real-time speed & instant stationary zero drop
          const rawSpeedMps = loc.coords.speed;
          let instantSpeedKmH = 0;

          if (rawSpeedMps !== null && rawSpeedMps !== undefined && rawSpeedMps > 0.3) {
            instantSpeedKmH = Math.min(60, rawSpeedMps * 3.6);
            lastMovementTimestamp.current = Date.now();
          } else {
            instantSpeedKmH = 0;
          }

          setCoordinates((prevCoords) => {
            if (prevCoords.length > 0) {
              const lastCoord = prevCoords[prevCoords.length - 1];
              const addedDist = calculateHaversineDistance(lastCoord, newCoord); // km
              const newTime = newCoord.timestamp || Date.now();
              const lastTime = lastCoord.timestamp || (newTime - 1000);
              const dtSeconds = Math.max(1, (newTime - lastTime) / 1000);
              const calculatedSpeedKmh = (addedDist / (dtSeconds / 3600));

              // Glitch rejection: Discard sudden GPS teleport spikes (>60 km/h walk/run, >110 km/h cycle)
              const maxAllowedSpeed = activityType === 'cycling' ? 110 : 55;
              if (calculatedSpeedKmh > maxAllowedSpeed && addedDist > 0.08) {
                return prevCoords;
              }

              // Jitter Deadband Filter: Only append new point if user has actually moved at least 3.0 meters (0.003 km)
              // OR if instantaneous speed > 0.4 m/s and distance > 1.8 meters
              if (addedDist >= 0.003 || (rawSpeedMps !== null && rawSpeedMps > 0.4 && addedDist >= 0.0018)) {
                setTotalDistanceKm((prevDist) => prevDist + addedDist);
                lastMovementTimestamp.current = Date.now();

                if (instantSpeedKmH === 0 && calculatedSpeedKmh > 1.0 && calculatedSpeedKmh < maxAllowedSpeed) {
                  instantSpeedKmH = calculatedSpeedKmh;
                }

                return [...prevCoords, newCoord];
              }

              // User is stationary or minor GPS drift: Keep polyline stable without injecting spiderweb noise
              return prevCoords;
            }

            // First valid GPS coordinate
            return [newCoord];
          });

          setCurrentSpeedKmH(Number(instantSpeedKmH.toFixed(1)));
        }
      );
    } catch (err) {
      console.log('GPS watch error:', err);
    }
  };

  // Init initial location
  useEffect(() => {
    async function initLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === Location.PermissionStatus.GRANTED;

        if (granted) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const initialCoord: LocationCoordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            timestamp: loc.timestamp || Date.now(),
          };
          setCurrentLocation(initialCoord);

          // Auto-generate target distance loop route if user selected a target distance
          if (targetDistanceKm > 0) {
            try {
              setIsRoutingLoading(true);
              const mode = activityType === 'cycling' ? 'cycling' : activityType === 'running' ? 'running' : 'walking';
              const res = await roadsAPI.getLoopRoute({
                lat: initialCoord.latitude,
                lng: initialCoord.longitude,
                distanceKm: targetDistanceKm,
                mode,
                areaKey: 'kp3',
              });
              if (res && res.success && res.data) {
                const routeFeature = res.data;
                setRecommendedRoute({
                  coordinates: routeFeature.geometry.coordinates,
                  distanceKm: routeFeature.properties.distanceKm,
                  safetyScore: routeFeature.properties.safetyScore,
                  mode: routeFeature.properties.mode,
                  segmentCount: routeFeature.properties.segmentCount,
                });
              }
            } catch (routeErr) {
              console.log('Auto loop route generation info:', routeErr);
            } finally {
              setIsRoutingLoading(false);
            }
          }
        }
      } catch (err) {
        console.log('Location init error:', err);
      }
    }
    initLocation();

    return () => {
      stopGPSWatch();
      stopTimer();
    };
  }, [activityType, targetDistanceKm]);

  // Preload Road Segments for Safety Heatmap
  useEffect(() => {
    async function loadRoadSegments() {
      try {
        const mode = activityType === 'cycling' ? 'cycling' : activityType === 'running' ? 'running' : 'walking';
        const geojson = await roadsAPI.getSegments({
          areaKey: 'kp3',
          mode,
          format: 'geojson',
        });
        if (geojson && geojson.type === 'FeatureCollection') {
          setRoadSegmentsGeoJSON(geojson);
        }
      } catch (err) {
        console.log('Load road segments info:', err);
      }
    }
    loadRoadSegments();
  }, [activityType]);

  // On-demand AI Safe Loop Route Toggle
  const handleToggleSafeRoute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (recommendedRoute) {
      setRecommendedRoute(null);
      return;
    }

    if (!currentLocation) {
      Alert.alert('GPS Required', 'Acquiring current GPS location to calculate nearest safe loop.');
      return;
    }

    const targetKm = targetDistanceKm > 0 ? targetDistanceKm : 2.0;

    try {
      setIsRoutingLoading(true);
      const mode = activityType === 'cycling' ? 'cycling' : activityType === 'running' ? 'running' : 'walking';
      const res = await roadsAPI.getLoopRoute({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        distanceKm: targetKm,
        mode,
        areaKey: 'kp3',
      });

      if (res && res.success && res.data) {
        const routeFeature = res.data;
        setRecommendedRoute({
          coordinates: routeFeature.geometry.coordinates,
          distanceKm: routeFeature.properties.distanceKm,
          safetyScore: routeFeature.properties.safetyScore,
          mode: routeFeature.properties.mode,
          segmentCount: routeFeature.properties.segmentCount,
        });
      }
    } catch (err: any) {
      Alert.alert(
        'Routing Info',
        err?.response?.data?.message || 'Could not generate a loop route nearby. Continuing with freeform tracking.'
      );
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Action Buttons
  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTrackingStatus('active');
    startTimer();
    startGPSWatch();
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTrackingStatus('paused');
    stopTimer();
    stopGPSWatch();
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTrackingStatus('active');
    startTimer();
    startGPSWatch();
  };

  const handleStopPrompt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Finish Workout?',
      'Record and store this session telemetry?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish & Save',
          style: 'destructive',
          onPress: () => {
            handleFinish();
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTrackingStatus('finished');
    stopTimer();
    stopGPSWatch();
    setShowSummaryModal(true);
  };

  const handleSaveWorkout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = getCurrentTimestamp();
    const sessionSteps = activityType !== 'cycling' ? Math.round(totalDistanceKm * 1300) : 0;
    const summary: WorkoutSummary = {
      id: generateWorkoutId(),
      activityType,
      startTime: now - elapsedSeconds * 1000,
      endTime: now,
      durationSeconds: elapsedSeconds,
      distanceKm: Number(totalDistanceKm.toFixed(2)),
      caloriesBurned: calories,
      avgPace: pace,
      avgSpeed: Number(avgSpeed),
      routeCoordinates: coordinates,
      earnedXP,
      steps: sessionSteps,
    };
    await workoutStorage.saveWorkout(summary);
    if (sessionSteps > 0) {
      await stepCounterService.addSteps(sessionSteps);
    }
    setShowSummaryModal(false);
    router.replace('/(tabs)/journal' as any);
  };

  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowUser(true);
    if (currentLocation && mapRef.current) {
      mapRef.current.centerOn(currentLocation, 16);
    }
  };

  // Calculations
  const pace = formatPace(elapsedSeconds, totalDistanceKm);
  const calories = calculateCalories(activityType, totalDistanceKm, elapsedSeconds);
  const earnedXP = calculateWorkoutXP(activityType, totalDistanceKm, elapsedSeconds);
  const avgSpeed = elapsedSeconds > 0 ? ((totalDistanceKm / (elapsedSeconds / 3600)) || 0).toFixed(1) : '0.0';

  const ActivityIcon =
    activityType === 'cycling'
      ? Bike
      : activityType === 'hiking'
      ? Mountain
      : activityType === 'walking'
      ? Compass
      : Footprints;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* TomTom Map Engine */}
      <TomTomMap
        ref={mapRef}
        apiKey={process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'CzZ9FdkTfX8xctGNP452EG8rOeh2757C'}
        currentLocation={currentLocation}
        walkingPath={coordinates}
        recommendedRoute={recommendedRoute}
        roadSegmentsGeoJSON={roadSegmentsGeoJSON}
        showSafetyHeatmap={showSafetyHeatmap}
        followUser={followUser}
        onUserDrag={() => setFollowUser(false)}
        onRoadSelected={(road) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedRoadInfo(road);
        }}
        onMapReady={() => console.log('TomTom map ready')}
        onError={(err) => console.log('TomTom map error:', err)}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT * 0.65}
      />

      {/* Floating Frosted Glass Top Bar */}
      <View style={styles.topBarWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 45 : 85} tint="dark" style={styles.topBarBlur}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => {
              if (trackingStatus === 'active') {
                handlePause();
              }
              router.back();
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Activity Live Badge */}
          <View style={styles.activityBadge}>
            <ActivityIcon size={15} color="#98E527" />
            <Text style={styles.activityBadgeText}>
              {activityType.toUpperCase()}
            </Text>
            {trackingStatus === 'active' && (
              <Animated.View style={[styles.livePulseBeacon, pulseStyle]} />
            )}
          </View>

          {/* Action Controls Group */}
          <View style={styles.topRightActions}>
            {/* AI Safe Route Toggle */}
            <TouchableOpacity
              style={[styles.circleBtn, recommendedRoute && styles.circleBtnRouteActive]}
              onPress={handleToggleSafeRoute}
              disabled={isRoutingLoading}
            >
              {isRoutingLoading ? (
                <ActivityIndicator size="small" color="#00D4FF" />
              ) : (
                <Sparkles size={16} color={recommendedRoute ? '#00D4FF' : '#FFFFFF'} />
              )}
            </TouchableOpacity>

            {/* Safety Heatmap Toggle */}
            <TouchableOpacity
              style={[styles.circleBtn, showSafetyHeatmap && styles.circleBtnHeatmapActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSafetyHeatmap((prev) => !prev);
              }}
            >
              <Layers size={16} color={showSafetyHeatmap ? '#00D4FF' : '#FFFFFF'} />
            </TouchableOpacity>

            {/* Recenter Button */}
            <TouchableOpacity
              style={[styles.circleBtn, followUser && styles.circleBtnActive]}
              onPress={handleRecenter}
            >
              <Navigation size={16} color={followUser ? '#000000' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Safe Route HUD Banner */}
      {recommendedRoute && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.safeRouteHudWrapper}>
          <BlurView intensity={50} tint="dark" style={styles.safeRouteHudBlur}>
            <View style={styles.safeRouteHudIconWrap}>
              <ShieldCheck size={16} color="#00D4FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safeRouteHudTitle}>
                {Math.round(recommendedRoute.safetyScore * 100)}% SAFETY SCORE • {recommendedRoute.distanceKm} KM LOOP
              </Text>
              <Text style={styles.safeRouteHudSubtitle}>
                Safe Corridor (Lit streets & low traffic)
              </Text>
            </View>
            <View style={styles.safeRouteLiveDot} />
          </BlurView>
        </Animated.View>
      )}

      {/* Road Segment Inspector Floating Pill */}
      {selectedRoadInfo && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.roadInspectorWrapper}>
          <BlurView intensity={50} tint="dark" style={styles.roadInspectorBlur}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roadInspectorName} numberOfLines={1}>
                {selectedRoadInfo.roadName}
              </Text>
              <View style={styles.roadInspectorMetrics}>
                <Text style={styles.roadInspectorScore}>
                  🛡️ {Math.round(selectedRoadInfo.safetyScore * 100)}/100 Safe
                </Text>
                {selectedRoadInfo.trafficLevel !== null && (
                  <Text style={styles.roadInspectorTraffic}>
                    🚦 {Math.round(selectedRoadInfo.trafficLevel * 100)}% Traffic
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.roadInspectorClose}
              onPress={() => setSelectedRoadInfo(null)}
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* Glassmorphic Bottom Telemetry Sheet */}
      <View style={styles.bottomSheetWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 55 : 95} tint="dark" style={styles.bottomSheetBlur}>
          {/* Primary Big Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.primaryMetric}>
              <Text style={styles.distanceValue}>{totalDistanceKm.toFixed(2)}</Text>
              <Text style={styles.metricUnit}>KILOMETERS</Text>
            </View>

            <View style={styles.primaryMetricDivider} />

            <View style={styles.primaryMetric}>
              <Text style={styles.timeValue}>{formatDuration(elapsedSeconds)}</Text>
              <Text style={styles.metricUnit}>DURATION</Text>
            </View>
          </View>

          {/* Target Progress Bar (if active) */}
          {targetDistanceKm > 0 && (
            <View style={styles.targetProgressContainer}>
              <View style={styles.targetProgressHeader}>
                <Text style={styles.targetProgressLabel}>Target: {targetDistanceKm.toFixed(1)} KM</Text>
                <Text style={styles.targetProgressPercent}>
                  {Math.min(100, Math.round((totalDistanceKm / targetDistanceKm) * 100))}%
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, (totalDistanceKm / targetDistanceKm) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Secondary Stats Glass Strip (Google Fit Style) */}
          <View style={styles.secondaryRow}>
            <View style={styles.secondaryItem}>
              <View style={styles.secIconWrap}>
                <Timer size={13} color="#98E527" />
              </View>
              <View>
                <Text style={styles.secVal}>{pace}</Text>
                <Text style={styles.secLabel}>Pace</Text>
              </View>
            </View>

            <View style={styles.secVerticalDivider} />

            <View style={styles.secondaryItem}>
              <View style={styles.secIconWrap}>
                <Flame size={13} color="#F97316" />
              </View>
              <View>
                <Text style={styles.secVal}>{calories}</Text>
                <Text style={styles.secLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.secVerticalDivider} />

            <View style={styles.secondaryItem}>
              <View style={styles.secIconWrap}>
                <Zap size={13} color="#00D4FF" />
              </View>
              <View>
                <Text style={styles.secVal}>{currentSpeedKmH.toFixed(1)}</Text>
                <Text style={styles.secLabel}>km/h</Text>
              </View>
            </View>
          </View>

          {/* Action Control Buttons */}
          <View style={styles.controlsRow}>
            {trackingStatus === 'idle' && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.startLargeBtn}
                onPress={handleStart}
              >
                <LinearGradient
                  colors={['#98E527', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startGradient}
                >
                  <Play size={20} color="#000000" fill="#000000" />
                  <Text style={styles.startBtnText}>START WORKOUT</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {trackingStatus === 'active' && (
              <View style={styles.activeControlsRow}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={handlePause}
                  activeOpacity={0.85}
                >
                  <Pause size={22} color="#000000" fill="#000000" />
                  <Text style={styles.pauseBtnText}>PAUSE</Text>
                </TouchableOpacity>
              </View>
            )}

            {trackingStatus === 'paused' && (
              <View style={styles.pausedControlsRow}>
                <TouchableOpacity
                  style={styles.resumeBtn}
                  onPress={handleResume}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#98E527', '#22C55E']}
                    style={styles.resumeGradient}
                  >
                    <Play size={18} color="#000000" fill="#000000" />
                    <Text style={styles.resumeBtnText}>RESUME</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.finishBtn}
                  onPress={handleStopPrompt}
                  activeOpacity={0.85}
                >
                  <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.finishBtnText}>FINISH</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
      </View>

      {/* Completion Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={Platform.OS === 'ios' ? 60 : 90} tint="dark" style={styles.modalBackdropBlur}>
            <Animated.View entering={ZoomIn.duration(400)} style={styles.summaryModalCard}>
              <View style={styles.celebrationIconWrap}>
                <LinearGradient
                  colors={['#98E527', '#22C55E']}
                  style={styles.celebrationGradient}
                >
                  <CheckCircle2 size={40} color="#000000" strokeWidth={2.5} />
                </LinearGradient>
              </View>

              <Text style={styles.modalTitle}>Workout Complete!</Text>
              <Text style={styles.modalSubtitle}>
                Session telemetry and rewards recorded to your ROVR profile.
              </Text>

              {/* XP Pill */}
              <View style={styles.xpAwardPill}>
                <Zap size={16} color="#98E527" />
                <Text style={styles.xpAwardText}>+{earnedXP} ROVR XP EARNED</Text>
              </View>

              {/* Matrix */}
              <View style={styles.summaryMatrix}>
                <View style={styles.matrixCol}>
                  <Text style={styles.matrixVal}>{totalDistanceKm.toFixed(2)} km</Text>
                  <Text style={styles.matrixLabel}>Distance</Text>
                </View>

                <View style={styles.matrixDivider} />

                <View style={styles.matrixCol}>
                  <Text style={styles.matrixVal}>{formatDuration(elapsedSeconds)}</Text>
                  <Text style={styles.matrixLabel}>Duration</Text>
                </View>

                <View style={styles.matrixDivider} />

                <View style={styles.matrixCol}>
                  <Text style={styles.matrixVal}>{calories} kcal</Text>
                  <Text style={styles.matrixLabel}>Active Burn</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveWorkout}
                >
                  <LinearGradient
                    colors={['#98E527', '#22C55E']}
                    style={styles.saveBtnGradient}
                  >
                    <Text style={styles.saveBtnText}>SAVE TO PROFILE</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.discardBtn}
                  onPress={() => {
                    setShowSummaryModal(false);
                    router.replace('/(tabs)' as any);
                  }}
                >
                  <Text style={styles.discardBtnText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  topBarWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    left: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  topBarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleBtnActive: {
    backgroundColor: '#98E527',
    borderColor: '#98E527',
  },
  circleBtnRouteActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.25)',
    borderColor: '#00D4FF',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtnHeatmapActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: '#00D4FF',
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.3)',
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  livePulseBeacon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#98E527',
  },

  // Safe Route HUD
  safeRouteHudWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 108,
    left: 16,
    right: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.35)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  safeRouteHudBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  safeRouteHudIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeRouteHudTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D4FF',
    letterSpacing: 0.5,
  },
  safeRouteHudSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  safeRouteLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4FF',
  },

  // Road Inspector
  roadInspectorWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 176 : 168,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  roadInspectorBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  roadInspectorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roadInspectorMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 3,
  },
  roadInspectorScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
  },
  roadInspectorTraffic: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roadInspectorClose: {
    padding: 4,
  },

  // Bottom Telemetry Sheet
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  bottomSheetBlur: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryMetric: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#98E527',
    letterSpacing: -1.5,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  primaryMetricDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  targetProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  targetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  targetProgressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  targetProgressPercent: {
    fontSize: 11,
    color: '#98E527',
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#98E527',
    borderRadius: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secVerticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },

  // Action Buttons
  controlsRow: {
    width: '100%',
  },
  startLargeBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  activeControlsRow: {
    width: '100%',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pauseBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  pausedControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeBtn: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  resumeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  resumeBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  finishBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdropBlur: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summaryModalCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 28, 0.95)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  celebrationIconWrap: {
    marginBottom: 14,
  },
  celebrationGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  xpAwardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(152, 229, 39, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.3)',
    marginBottom: 18,
  },
  xpAwardText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#98E527',
    letterSpacing: 0.5,
  },
  summaryMatrix: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  matrixCol: {
    alignItems: 'center',
  },
  matrixVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matrixLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  matrixDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#98E527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  discardBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});