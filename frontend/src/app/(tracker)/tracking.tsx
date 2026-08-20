import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  MapPin,
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
} from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import Animated, { ZoomIn, FadeInDown, FadeOutUp } from 'react-native-reanimated';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    activityType?: ActivityType;
    targetDistance?: string;
    useSafeRoute?: string;
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
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMovementTimestamp = useRef<number>(Date.now());

  // Timer helper functions
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Auto zero-decay speed if stationary for more than 2 seconds
      if (Date.now() - lastMovementTimestamp.current > 2000) {
        setCurrentSpeedKmH(0);
      }
    }, 1000);
  };

  const stopGPSWatch = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setCurrentSpeedKmH(0);
  };

  // Simulation mode for testing on simulators/without physical movement
  const startSimulation = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    let lat = currentLocation?.latitude || 28.6139;
    let lon = currentLocation?.longitude || 77.209;

    simulationTimerRef.current = setInterval(() => {
      lat += (Math.random() - 0.45) * 0.00015;
      lon += (Math.random() - 0.45) * 0.00015;

      const simCoord: LocationCoordinate = {
        latitude: lat,
        longitude: lon,
        timestamp: getCurrentTimestamp(),
      };

      setCurrentLocation(simCoord);
      lastMovementTimestamp.current = Date.now();
      setCurrentSpeedKmH(4.8);

      setCoordinates((prev) => {
        if (prev.length > 0) {
          const added = calculateHaversineDistance(prev[prev.length - 1], simCoord);
          setTotalDistanceKm((d) => d + added);
        }
        return [...prev, simCoord];
      });
    }, 2000);
  };

  // Start live GPS watching
  const startGPSWatch = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1.5,
        },
        (loc) => {
          const newCoord: LocationCoordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          };

          setCurrentLocation(newCoord);

          // Calculate real-time speed & instant stationary detection
          const rawSpeedMps = loc.coords.speed;
          let instantSpeedKmH = 0;

          // Threshold: if speed is below 0.3 m/s (~1 km/h), user is standing still
          if (rawSpeedMps !== null && rawSpeedMps !== undefined && rawSpeedMps > 0.3) {
            instantSpeedKmH = Math.min(60, rawSpeedMps * 3.6);
            lastMovementTimestamp.current = Date.now();
          } else {
            instantSpeedKmH = 0;
          }

          setCoordinates((prevCoords) => {
            if (prevCoords.length > 0) {
              const lastCoord = prevCoords[prevCoords.length - 1];
              const addedDist = calculateHaversineDistance(lastCoord, newCoord);

              // Only accumulate if movement exceeds GPS jitter threshold (> 1.5 meters)
              if (addedDist > 0.0015) {
                setTotalDistanceKm((prevDist) => prevDist + addedDist);
                lastMovementTimestamp.current = Date.now();

                // If hardware GPS speed was null, fallback to delta speed calculation
                if (instantSpeedKmH === 0 && (rawSpeedMps === null || rawSpeedMps === undefined)) {
                  const newTime = newCoord.timestamp || Date.now();
                  const lastTime = lastCoord.timestamp || (newTime - 1000);
                  const dtSeconds = Math.max(1, (newTime - lastTime) / 1000);
                  const deltaSpeed = addedDist / (dtSeconds / 3600);
                  if (deltaSpeed > 1.0 && deltaSpeed < 45) {
                    instantSpeedKmH = deltaSpeed;
                  }
                }
              }
            }
            return [...prevCoords, newCoord];
          });

          setCurrentSpeedKmH(Number(instantSpeedKmH.toFixed(1)));
        }
      );
    } catch (err) {
      console.log('GPS watch error:', err);
      startSimulation();
    }
  };

  // Initialize and get initial location
  useEffect(() => {
    async function initLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === Location.PermissionStatus.GRANTED;

        if (granted) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const initialCoord: LocationCoordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          };
          setCurrentLocation(initialCoord);
          // Initial centering is handled by TomTomMap via currentLocation prop
        } else {
          // Default fallback location (e.g. New Delhi / Central Park)
          const fallbackCoord: LocationCoordinate = {
            latitude: 28.6139,
            longitude: 77.209,
          };
          setCurrentLocation(fallbackCoord);
        }
      } catch (err) {
        console.log('Location init error:', err);
      }
    }
    initLocation();

    return () => {
      stopGPSWatch();
      stopTimer();
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Preload Road Segments GeoJSON for Safety Heatmap Layer
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

  // On-demand handler to generate or clear AI Safe Loop Route
  const handleToggleSafeRoute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If recommended route is already active, dismiss it
    if (recommendedRoute) {
      setRecommendedRoute(null);
      return;
    }

    if (!currentLocation) {
      Alert.alert('GPS Required', 'Acquiring your current GPS location to calculate the nearest safe loop route.');
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
        err?.response?.data?.message || 'Could not generate a loop route nearby. You can continue with freeform tracking.'
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
      'Are you ready to complete and record this session?',
      [
        { text: 'Resume', style: 'cancel' },
        {
          text: 'Finish Workout',
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
    };
    await workoutStorage.saveWorkout(summary);
    setShowSummaryModal(false);
    router.replace('/(tracker)/workout' as any);
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
      {/* TomTom Map View */}
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

      {/* Top Floating Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => {
            if (trackingStatus === 'active') {
              handlePause();
            }
            router.back();
          }}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.activityBadge}>
          <ActivityIcon size={16} color="#98E527" />
          <Text style={styles.activityBadgeText}>
            {activityType.toUpperCase()}
          </Text>
        </View>

        <View style={styles.topRightActions}>
          {/* AI Safe Route Suggestion Toggle (On-Demand) */}
          <TouchableOpacity
            style={[styles.circleBtn, recommendedRoute && styles.circleBtnRouteActive]}
            onPress={handleToggleSafeRoute}
            disabled={isRoutingLoading}
          >
            {isRoutingLoading ? (
              <ActivityIndicator size="small" color="#00D4FF" />
            ) : (
              <Sparkles size={18} color={recommendedRoute ? '#00D4FF' : '#FFFFFF'} />
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
            <Layers size={18} color={showSafetyHeatmap ? '#00D4FF' : '#FFFFFF'} />
          </TouchableOpacity>

          {/* Recenter Button */}
          <TouchableOpacity
            style={[styles.circleBtn, followUser && styles.circleBtnActive]}
            onPress={handleRecenter}
          >
            <Navigation size={18} color={followUser ? '#000000' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Safe Route HUD Banner */}
      {recommendedRoute && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.safeRouteHud}>
          <View style={styles.safeRouteHudIconWrap}>
            <ShieldCheck size={16} color="#00D4FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safeRouteHudTitle}>
              {Math.round(recommendedRoute.safetyScore * 100)}% SAFETY SCORE • {recommendedRoute.distanceKm} KM LOOP
            </Text>
            <Text style={styles.safeRouteHudSubtitle}>
              Recommended Safe Corridor (Lit roads & low traffic)
            </Text>
          </View>
          <View style={styles.safeRouteLiveDot} />
        </Animated.View>
      )}

      {/* Road Segment Inspector Floating Pill */}
      {selectedRoadInfo && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.roadInspectorCard}>
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
                  🚦 Traffic: {Math.round(selectedRoadInfo.trafficLevel * 100)}%
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
        </Animated.View>
      )}

      {/* Bottom Floating Telemetry Dashboard */}
      <View style={styles.bottomSheet}>
        {/* Primary Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Distance */}
          <View style={styles.primaryMetric}>
            <Text style={styles.distanceValue}>
              {totalDistanceKm.toFixed(2)}
            </Text>
            <Text style={styles.metricUnit}>KILOMETERS</Text>
          </View>

          {/* Time */}
          <View style={styles.primaryMetric}>
            <Text style={styles.timeValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.metricUnit}>DURATION</Text>
          </View>
        </View>

        {/* Distance Target Progress Bar (if set) */}
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

        {/* Secondary Metrics Bar */}
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryItem}>
            <View style={styles.secIconWrap}>
              <MapPin size={14} color="#98E527" />
            </View>
            <View>
              <Text style={styles.secVal}>{pace}</Text>
              <Text style={styles.secLabel}>Avg Pace</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.secondaryItem}>
            <View style={styles.secIconWrap}>
              <Flame size={14} color="#F97316" />
            </View>
            <View>
              <Text style={styles.secVal}>{calories}</Text>
              <Text style={styles.secLabel}>Calories</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.secondaryItem}>
            <View style={styles.secIconWrap}>
              <Zap size={14} color="#00D4FF" />
            </View>
            <View>
              <Text style={styles.secVal}>{currentSpeedKmH.toFixed(1)} km/h</Text>
              <Text style={styles.secLabel}>Speed</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          {trackingStatus === 'idle' && (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.startLargeBtn}
              onPress={handleStart}
            >
              <LinearGradient
                colors={['#98E527', '#4ADE80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startGradient}
              >
                <Play size={22} color="#000000" fill="#000000" />
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
                <Pause size={24} color="#000000" fill="#000000" />
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
                  colors={['#98E527', '#4ADE80']}
                  style={styles.resumeGradient}
                >
                  <Play size={20} color="#000000" fill="#000000" />
                  <Text style={styles.resumeBtnText}>RESUME</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishBtn}
                onPress={handleStopPrompt}
                activeOpacity={0.85}
              >
                <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.finishBtnText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Workout Completion Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.summaryModalCard}>
            <View style={styles.celebrationIconWrap}>
              <LinearGradient
                colors={['#98E527', '#4ADE80']}
                style={styles.celebrationGradient}
              >
                <CheckCircle2 size={44} color="#000000" strokeWidth={2.5} />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>Workout Complete!</Text>
            <Text style={styles.modalSubtitle}>
              Great job! Your activity telemetry and rewards have been compiled.
            </Text>

            {/* XP Award Pill */}
            <View style={styles.xpAwardPill}>
              <Zap size={18} color="#98E527" />
              <Text style={styles.xpAwardText}>+{earnedXP} ROVR XP EARNED</Text>
            </View>

            {/* Stats Summary Matrix */}
            <View style={styles.summaryMatrix}>
              <View style={styles.matrixCol}>
                <Text style={styles.matrixVal}>{totalDistanceKm.toFixed(2)} km</Text>
                <Text style={styles.matrixLabel}>Total Distance</Text>
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

            {/* Save & Discard Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveWorkout}
              >
                <LinearGradient
                  colors={['#98E527', '#4ADE80']}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>SAVE TO PROFILE</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.discardBtn}
                onPress={() => {
                  setShowSummaryModal(false);
                  router.replace('/(tracker)/workout' as any);
                }}
              >
                <Text style={styles.discardBtnText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  // Map styles are now handled inside TomTomMap component
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    gap: 10,
  },
  circleBtnHeatmapActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: '#00D4FF',
  },
  safeRouteHud: {
    position: 'absolute',
    top: 108,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(18, 18, 26, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
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
    fontSize: 12,
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
  roadInspectorCard: {
    position: 'absolute',
    top: 170,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(22, 22, 34, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
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
    color: '#10B981',
  },
  roadInspectorTraffic: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roadInspectorClose: {
    padding: 4,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.4)',
  },
  activityBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0E0E17',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  primaryMetric: {
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  timeValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#98E527',
    letterSpacing: -1,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  targetProgressContainer: {
    backgroundColor: '#161624',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#242438',
  },
  targetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  targetProgressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  targetProgressPercent: {
    fontSize: 11,
    color: '#98E527',
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#2A2A3E',
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
    backgroundColor: '#161624',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#242438',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2A3E',
  },
  controlsRow: {
    width: '100%',
  },
  startLargeBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  startBtnText: {
    fontSize: 17,
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
  },
  resumeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  resumeBtnText: {
    fontSize: 16,
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
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summaryModalCard: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E1E2E',
  },
  celebrationIconWrap: {
    marginBottom: 16,
  },
  celebrationGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  xpAwardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(152, 229, 39, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.3)',
    marginBottom: 20,
  },
  xpAwardText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#98E527',
    letterSpacing: 0.5,
  },
  summaryMatrix: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#181824',
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#242436',
  },
  matrixCol: {
    alignItems: 'center',
  },
  matrixVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matrixLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  matrixDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2A2A3E',
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  discardBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});