import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline,
  Region,
  MapType,
} from 'react-native-maps';
import Constants from 'expo-constants';
import { rovrDarkMapStyle } from '@/constants/mapStyle';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp?: number;
}

interface ActivityMapViewProps {
  currentLocation: LocationCoordinate | null;
  routeCoordinates: LocationCoordinate[];
  isTracking: boolean;
  mapType?: MapType;
  isDarkMode?: boolean;
  initialRegion?: Region;
}

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.015,
  longitudeDelta: 0.0121,
};

export function ActivityMapView({
  currentLocation,
  routeCoordinates,
  mapType = 'standard',
  isDarkMode = true,
  initialRegion,
}: ActivityMapViewProps) {
  const mapRef = useRef<MapView>(null);

  const hasApiKey = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      Constants.expoConfig?.extra?.googleMapsApiKey
  );

  const region: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : initialRegion || DEFAULT_REGION;

  // Animate camera when location updates during workout
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'web' ? undefined : PROVIDER_GOOGLE}
        initialRegion={region}
        mapType={mapType}
        customMapStyle={isDarkMode ? rovrDarkMapStyle : undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#6C63FF"
        loadingBackgroundColor="#0A0A0F"
      >
        {/* User Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Current Location"
            description="Your active position"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerInner} />
            </View>
          </Marker>
        )}

        {/* Workout Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates.map((c) => ({
              latitude: c.latitude,
              longitude: c.longitude,
            }))}
            strokeColor="#6C63FF"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Credential Status Overlay Notice */}
      {!hasApiKey && (
        <View style={styles.apiKeyNotice}>
          <Text style={styles.apiKeyNoticeTitle}>
            Map Infrastructure Ready
          </Text>
          <Text style={styles.apiKeyNoticeText}>
            Full map tiles require EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#12121A',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  apiKeyNotice: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(18, 18, 26, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
    alignItems: 'center',
  },
  apiKeyNoticeTitle: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  apiKeyNoticeText: {
    color: '#A0A0B0',
    fontSize: 10,
    textAlign: 'center',
  },
});
