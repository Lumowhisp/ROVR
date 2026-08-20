import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Activity,
  Compass,
  Play,
  Square,
} from 'lucide-react-native';

export default function GPSTest() {
  const router = useRouter();
  const [permission, setPermission] = useState<string>('Not requested');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number; altitude?: number | null; speed?: number | null; timestamp: number }[]
  >([]);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      setLocationEnabled(enabled);

      if (!enabled) {
        return;
      }

      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      setIsWatching(true);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1500,
          distanceInterval: 2,
        },
        (location: Location.LocationObject) => {
          const { latitude, longitude, altitude, speed } = location.coords;

          const newCoordinate = {
            latitude,
            longitude,
            altitude,
            speed,
            timestamp: location.timestamp,
          };

          setRouteCoordinates((previousCoordinates) => [
            newCoordinate,
            ...previousCoordinates.slice(0, 49), // Keep latest 50
          ]);
        }
      );
    } catch (err) {
      console.log('GPS test error:', err);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsWatching(false);
  };

  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const latest = routeCoordinates[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#12121A', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GPS Diagnostics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLabelWrap}>
              <Navigation size={18} color="#98E527" />
              <Text style={styles.statusLabel}>Permission Status</Text>
            </View>
            <View style={[styles.badge, permission === 'granted' ? styles.badgeSuccess : styles.badgeWarn]}>
              <Text style={styles.badgeText}>{permission.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusRow}>
            <View style={styles.statusLabelWrap}>
              <Compass size={18} color="#00D4FF" />
              <Text style={styles.statusLabel}>Hardware Sensor</Text>
            </View>
            <View style={[styles.badge, locationEnabled ? styles.badgeSuccess : styles.badgeWarn]}>
              <Text style={styles.badgeText}>{locationEnabled ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
          </View>
        </View>

        {/* Real-time Telemetry Card */}
        {latest ? (
          <View style={styles.telemetryCard}>
            <View style={styles.cardHeader}>
              <Activity size={18} color="#98E527" />
              <Text style={styles.cardTitle}>Live GPS Telemetry</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Latitude</Text>
                <Text style={styles.gridVal}>{latest.latitude.toFixed(6)}°</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Longitude</Text>
                <Text style={styles.gridVal}>{latest.longitude.toFixed(6)}°</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Altitude</Text>
                <Text style={styles.gridVal}>
                  {latest.altitude ? `${latest.altitude.toFixed(1)} m` : 'N/A'}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Speed</Text>
                <Text style={styles.gridVal}>
                  {latest.speed && latest.speed > 0 ? `${(latest.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h'}
                </Text>
              </View>
            </View>

            <View style={styles.sampleCountRow}>
              <CheckCircle2 size={16} color="#98E527" />
              <Text style={styles.sampleCountText}>
                {routeCoordinates.length} Location packets recorded
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <AlertCircle size={32} color="#64748B" />
            <Text style={styles.emptyTitle}>No GPS Packets Yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the button below to start querying native device hardware location coordinates.
            </Text>
          </View>
        )}

        {/* Logs Table */}
        {routeCoordinates.length > 0 && (
          <View style={styles.logsCard}>
            <Text style={styles.logsTitle}>Coordinate Stream (Latest 50)</Text>
            {routeCoordinates.slice(0, 10).map((coord, idx) => (
              <View key={coord.timestamp + idx} style={styles.logRow}>
                <Text style={styles.logIdx}>#{routeCoordinates.length - idx}</Text>
                <Text style={styles.logCoords}>
                  {coord.latitude.toFixed(5)}, {coord.longitude.toFixed(5)}
                </Text>
                <Text style={styles.logTime}>
                  {new Date(coord.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {!isWatching ? (
          <TouchableOpacity style={styles.startBtn} onPress={startTracking} activeOpacity={0.88}>
            <LinearGradient colors={['#98E527', '#4ADE80']} style={styles.btnGradient}>
              <Play size={20} color="#000000" fill="#000000" />
              <Text style={styles.btnText}>START GPS STREAM</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={stopTracking} activeOpacity={0.88}>
            <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.stopBtnText}>STOP STREAM</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(152, 229, 39, 0.15)',
  },
  badgeWarn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#98E527',
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#1E1E2E',
    marginVertical: 14,
  },
  telemetryCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(152, 229, 39, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#181824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242436',
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sampleCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  sampleCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#98E527',
  },
  emptyCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  logsCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A28',
  },
  logIdx: {
    fontSize: 12,
    color: '#98E527',
    fontWeight: '700',
    width: 35,
  },
  logCoords: {
    fontSize: 12,
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logTime: {
    fontSize: 11,
    color: '#64748B',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stopBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});