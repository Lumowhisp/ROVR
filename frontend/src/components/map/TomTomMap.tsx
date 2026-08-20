/**
 * TomTomMap.tsx — React Native component that renders a TomTom map inside a WebView.
 *
 * Supports:
 * - Night theme map
 * - User location pulsing marker
 * - User live walking polyline (Green #98E527)
 * - Start point marker
 * - Safety Routing: Recommended Safe Loop Route (Cyan #00D4FF with glowing stroke)
 * - Safety Heatmap: Road segments color-coded by safety scores (Green / Amber / Red)
 * - Interactive road segment details on tap
 */
import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { LocationCoordinate } from '@/types/workout';
import {
  sendToMap,
  parseMapMessage,
  coordsToTomTom,
  type SafeRouteData,
} from './mapBridge';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TomTomMapProps {
  /** TomTom API key */
  apiKey: string;
  /** Current GPS location to show as blue dot */
  currentLocation: LocationCoordinate | null;
  /** Array of walking path coordinates for the polyline */
  walkingPath: LocationCoordinate[];
  /** Recommended safe route from routing engine */
  recommendedRoute?: SafeRouteData | null;
  /** Road segments GeoJSON for safety overlay */
  roadSegmentsGeoJSON?: any | null;
  /** Toggle safety heatmap overlay */
  showSafetyHeatmap?: boolean;
  /** Initial center for the map if no currentLocation yet */
  initialCenter?: { latitude: number; longitude: number };
  /** Whether the map should auto-follow the user's location */
  followUser?: boolean;
  /** Called when the map has finished initializing */
  onMapReady?: () => void;
  /** Called when the user manually drags the map */
  onUserDrag?: () => void;
  /** Called when a road segment is clicked on the map */
  onRoadSelected?: (road: { segmentId: string; roadName: string; safetyScore: number; trafficLevel: number | null }) => void;
  /** Called on map errors */
  onError?: (error: string) => void;
  /** Width style */
  width?: DimensionValue;
  /** Height style */
  height?: DimensionValue;
}

/** Ref handle exposed to parent components */
export interface TomTomMapHandle {
  centerOn: (location: LocationCoordinate, zoom?: number) => void;
  fitRouteBounds: (coordinates: [number, number][]) => void;
}

// ─── HTML Template ───────────────────────────────────────────────────────────

function generateMapHTML(apiKey: string, lat: number, lng: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css" />
  <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0A0A0F;
    }

    /* User location pulsing dot */
    .user-location-marker {
      width: 24px;
      height: 24px;
      position: relative;
    }
    .user-dot {
      width: 14px;
      height: 14px;
      background: #38BDF8;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }
    .user-pulse {
      width: 44px;
      height: 44px;
      background: rgba(56, 189, 248, 0.25);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 2s ease-out infinite;
      z-index: 1;
    }
    @keyframes pulse {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; }
    }

    /* Start marker */
    .start-marker {
      width: 22px;
      height: 22px;
      position: relative;
    }
    .start-outer {
      width: 22px;
      height: 22px;
      background: rgba(152, 229, 39, 0.35);
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .start-inner {
      width: 12px;
      height: 12px;
      background: #98E527;
      border-radius: 50%;
      border: 2px solid #000000;
      position: absolute;
      top: 5px;
      left: 5px;
    }

    /* Road popup styling */
    .mapboxgl-popup-content, .tt-popup-content {
      background: #161622 !important;
      color: #FFFFFF !important;
      border: 1px solid #2D2D44 !important;
      border-radius: 12px !important;
      padding: 10px 14px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
    }
    .mapboxgl-popup-tip, .tt-popup-tip {
      border-top-color: #161622 !important;
    }

    /* Hide TomTom default logo/attribution for cleaner look in mobile app */
    .tt-logo-container { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // ── State ──
    var map = null;
    var userMarker = null;
    var startMarkerObj = null;
    var popup = null;
    var isReady = false;
    var heatmapVisible = false;

    // ── Initialize Map ──
    try {
      map = tt.map({
        key: '${apiKey}',
        container: 'map',
        center: [${lng}, ${lat}],
        zoom: 16,
        style: {
          map: 'basic_night',
          poi: 'poi_main',
          trafficIncidents: 'incidents_night',
          trafficFlow: 'flow_relative0'
        },
        dragPan: true,
        scrollZoom: true,
        doubleClickZoom: true,
        touchZoomRotate: true
      });

      map.addControl(new tt.NavigationControl(), 'bottom-right');

      map.on('load', function() {
        isReady = true;
        sendToRN({ type: 'MAP_READY' });
      });

      map.on('dragstart', function() {
        sendToRN({ type: 'USER_DRAG' });
      });

    } catch (e) {
      sendToRN({ type: 'MAP_ERROR', error: e.message || 'Map init failed' });
    }

    // ── Send message to React Native ──
    function sendToRN(msg) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      } catch(e) {}
    }

    // ── Create user location marker element ──
    function createUserLocationEl() {
      var el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
      return el;
    }

    // ── Create start marker element ──
    function createStartMarkerEl() {
      var el = document.createElement('div');
      el.className = 'start-marker';
      el.innerHTML = '<div class="start-outer"></div><div class="start-inner"></div>';
      return el;
    }

    // ── Handle messages from React Native ──
    window.handleRNMessage = function(msg) {
      if (!map) return;

      switch (msg.type) {

        case 'CENTER_MAP':
          if (msg.animate) {
            map.easeTo({
              center: [msg.longitude, msg.latitude],
              zoom: msg.zoom || map.getZoom(),
              duration: 300,
              easing: function(t) { return t; }
            });
          } else {
            map.jumpTo({
              center: [msg.longitude, msg.latitude],
              zoom: msg.zoom || map.getZoom()
            });
          }
          break;

        case 'UPDATE_USER_LOCATION':
          var lngLat = [msg.longitude, msg.latitude];
          if (userMarker) {
            userMarker.setLngLat(lngLat);
          } else {
            userMarker = new tt.Marker({ element: createUserLocationEl(), anchor: 'center' })
              .setLngLat(lngLat)
              .addTo(map);
          }
          break;

        case 'UPDATE_WALKING_PATH':
          var coords = msg.coordinates;
          if (!coords || coords.length < 2) break;

          var geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          };

          if (map.getSource('walking-path')) {
            map.getSource('walking-path').setData(geojson);
          } else {
            map.addSource('walking-path', { type: 'geojson', data: geojson });
            map.addLayer({
              id: 'walking-path-line',
              type: 'line',
              source: 'walking-path',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#98E527',
                'line-width': 5,
                'line-opacity': 0.95
              }
            });
          }
          break;

        case 'SET_RECOMMENDED_ROUTE':
          var route = msg.route;
          if (!route || !route.coordinates || route.coordinates.length < 2) break;

          var routeGeojson = {
            type: 'Feature',
            properties: {
              safetyScore: route.safetyScore,
              distanceKm: route.distanceKm,
            },
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          };

          // Glow background layer for recommended route
          if (!map.getSource('recommended-route')) {
            map.addSource('recommended-route', { type: 'geojson', data: routeGeojson });

            map.addLayer({
              id: 'recommended-route-glow',
              type: 'line',
              source: 'recommended-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#00D4FF',
                'line-width': 10,
                'line-opacity': 0.25,
                'line-blur': 3
              }
            });

            map.addLayer({
              id: 'recommended-route-line',
              type: 'line',
              source: 'recommended-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#00D4FF',
                'line-width': 4,
                'line-opacity': 0.95
              }
            });
          } else {
            map.getSource('recommended-route').setData(routeGeojson);
          }

          // Fit bounds to show the entire recommended loop
          try {
            var bounds = new tt.LngLatBounds();
            route.coordinates.forEach(function(coord) {
              bounds.extend(coord);
            });
            map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 1000 });
          } catch(e) {}
          break;

        case 'CLEAR_RECOMMENDED_ROUTE':
          if (map.getLayer('recommended-route-line')) map.removeLayer('recommended-route-line');
          if (map.getLayer('recommended-route-glow')) map.removeLayer('recommended-route-glow');
          if (map.getSource('recommended-route')) map.removeSource('recommended-route');
          break;

        case 'SET_ROAD_SEGMENTS':
          var segmentsGeojson = msg.geojson;
          if (!segmentsGeojson) break;

          if (map.getSource('road-safety-network')) {
            map.getSource('road-safety-network').setData(segmentsGeojson);
          } else {
            map.addSource('road-safety-network', { type: 'geojson', data: segmentsGeojson });

            // Layer with color coding based on safetyScore
            map.addLayer({
              id: 'road-safety-lines',
              type: 'line',
              source: 'road-safety-network',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': heatmapVisible ? 'visible' : 'none'
              },
              paint: {
                'line-color': [
                  'case',
                  ['>=', ['coalesce', ['get', 'selectedSafetyScore'], ['get', 'safetyScore'], 0.5], 0.70],
                  '#10B981', // High Safety: Emerald Green
                  ['>=', ['coalesce', ['get', 'selectedSafetyScore'], ['get', 'safetyScore'], 0.5], 0.50],
                  '#F59E0B', // Medium Safety: Amber
                  '#EF4444'  // Lower Safety: Red
                ],
                'line-width': 4,
                'line-opacity': 0.75
              }
            });

            // Tap listener for road safety popup
            map.on('click', 'road-safety-lines', function(e) {
              if (e.features && e.features[0]) {
                var f = e.features[0];
                var p = f.properties;
                var score = Math.round(((p.selectedSafetyScore || p.safetyScore || 0.5) * 100));
                var roadName = p.roadName || 'Road Segment';
                var roadType = p.roadType || 'road';
                var traffic = p.trafficLevel ? Math.round(p.trafficLevel * 100) + '%' : 'Normal';

                sendToRN({
                  type: 'ROAD_SELECTED',
                  segmentId: p.segmentId || '',
                  roadName: roadName,
                  safetyScore: p.selectedSafetyScore || p.safetyScore || 0.5,
                  trafficLevel: p.trafficLevel || null
                });

                if (popup) popup.remove();
                popup = new tt.Popup({ offset: 10 })
                  .setLngLat(e.lngLat)
                  .setHTML(
                    '<div style="font-weight:700;margin-bottom:4px;color:#FFFFFF;">' + roadName + '</div>' +
                    '<div style="color:#94A3B8;font-size:11px;margin-bottom:6px;">Type: ' + roadType + '</div>' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="color:#10B981;font-weight:800;font-size:13px;">🛡️ ' + score + '/100 Safe</span>' +
                    '</div>'
                  )
                  .addTo(map);
              }
            });
          }
          break;

        case 'TOGGLE_SAFETY_HEATMAP':
          heatmapVisible = Boolean(msg.enabled);
          if (map.getLayer('road-safety-lines')) {
            map.setLayoutProperty('road-safety-lines', 'visibility', heatmapVisible ? 'visible' : 'none');
          }
          break;

        case 'ADD_START_MARKER':
          if (startMarkerObj) {
            startMarkerObj.setLngLat([msg.longitude, msg.latitude]);
          } else {
            startMarkerObj = new tt.Marker({ element: createStartMarkerEl(), anchor: 'center' })
              .setLngLat([msg.longitude, msg.latitude])
              .addTo(map);
          }
          break;

        case 'CLEAR_OVERLAYS':
          if (map.getLayer('walking-path-line')) {
            map.removeLayer('walking-path-line');
            map.removeSource('walking-path');
          }
          if (userMarker) { userMarker.remove(); userMarker = null; }
          if (startMarkerObj) { startMarkerObj.remove(); startMarkerObj = null; }
          if (popup) { popup.remove(); popup = null; }
          break;
      }
    };
  </script>
</body>
</html>
  `.trim();
}

// ─── Component ───────────────────────────────────────────────────────────────

const TomTomMap = forwardRef<TomTomMapHandle, TomTomMapProps>(function TomTomMap(
  {
    apiKey,
    currentLocation,
    walkingPath,
    recommendedRoute,
    roadSegmentsGeoJSON,
    showSafetyHeatmap = false,
    initialCenter,
    followUser = true,
    onMapReady,
    onUserDrag,
    onRoadSelected,
    onError,
    width,
    height,
  },
  ref
) {
  const webViewRef = useRef<WebView | null>(null);
  const isMapReady = useRef(false);
  const startMarkerAdded = useRef(false);

  // Store the initial center ONCE so the HTML source is completely static
  // and does NOT cause the WebView to reload on every location change!
  const initialCenterRef = useRef<{ latitude: number; longitude: number }>(
    initialCenter || currentLocation || { latitude: 28.46178, longitude: 77.50553 }
  );

  // Memoize the static HTML source — this must NEVER change reference during tracking!
  const htmlSource = useRef<{ html: string }>({
    html: generateMapHTML(
      apiKey,
      initialCenterRef.current.latitude,
      initialCenterRef.current.longitude
    ),
  }).current;

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    centerOn(location: LocationCoordinate, zoom?: number) {
      sendToMap(webViewRef, {
        type: 'CENTER_MAP',
        latitude: location.latitude,
        longitude: location.longitude,
        zoom,
        animate: true,
      });
    },
    fitRouteBounds(coordinates: [number, number][]) {
      if (coordinates.length > 0) {
        sendToMap(webViewRef, {
          type: 'SET_RECOMMENDED_ROUTE',
          route: {
            coordinates,
            distanceKm: 0,
            safetyScore: 0,
          },
        });
      }
    },
  }));

  // Handle messages from the WebView
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMapMessage(event.nativeEvent.data);
      if (!message) return;

      switch (message.type) {
        case 'MAP_READY':
          isMapReady.current = true;
          onMapReady?.();

          // Send current location if available
          if (currentLocation) {
            sendToMap(webViewRef, {
              type: 'UPDATE_USER_LOCATION',
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            });
            if (followUser) {
              sendToMap(webViewRef, {
                type: 'CENTER_MAP',
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                animate: false,
              });
            }
          }

          // Send walking path if already recorded
          if (walkingPath && walkingPath.length >= 2) {
            sendToMap(webViewRef, {
              type: 'UPDATE_WALKING_PATH',
              coordinates: coordsToTomTom(walkingPath),
            });
            if (!startMarkerAdded.current) {
              startMarkerAdded.current = true;
              sendToMap(webViewRef, {
                type: 'ADD_START_MARKER',
                latitude: walkingPath[0].latitude,
                longitude: walkingPath[0].longitude,
              });
            }
          }

          // Send recommended route if available
          if (recommendedRoute) {
            sendToMap(webViewRef, {
              type: 'SET_RECOMMENDED_ROUTE',
              route: recommendedRoute,
            });
          }

          // Send road segments if available
          if (roadSegmentsGeoJSON) {
            sendToMap(webViewRef, {
              type: 'SET_ROAD_SEGMENTS',
              geojson: roadSegmentsGeoJSON,
            });
          }
          break;

        case 'USER_DRAG':
          onUserDrag?.();
          break;

        case 'ROAD_SELECTED':
          onRoadSelected?.({
            segmentId: message.segmentId,
            roadName: message.roadName,
            safetyScore: message.safetyScore,
            trafficLevel: message.trafficLevel,
          });
          break;

        case 'MAP_ERROR':
          onError?.(message.error);
          break;
      }
    },
    [onMapReady, onUserDrag, onRoadSelected, onError, currentLocation, followUser, walkingPath, recommendedRoute, roadSegmentsGeoJSON]
  );

  // Update user location marker + follow camera smoothly
  useEffect(() => {
    if (!isMapReady.current || !currentLocation) return;

    sendToMap(webViewRef, {
      type: 'UPDATE_USER_LOCATION',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });

    if (followUser) {
      sendToMap(webViewRef, {
        type: 'CENTER_MAP',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        animate: true,
      });
    }
  }, [currentLocation, followUser]);

  // Update walking path polyline whenever GPS coordinates update
  useEffect(() => {
    if (!isMapReady.current || !walkingPath || walkingPath.length < 2) return;

    sendToMap(webViewRef, {
      type: 'UPDATE_WALKING_PATH',
      coordinates: coordsToTomTom(walkingPath),
    });

    if (!startMarkerAdded.current && walkingPath.length >= 2) {
      startMarkerAdded.current = true;
      sendToMap(webViewRef, {
        type: 'ADD_START_MARKER',
        latitude: walkingPath[0].latitude,
        longitude: walkingPath[0].longitude,
      });
    }
  }, [walkingPath]);

  // Update recommended route polyline
  useEffect(() => {
    if (!isMapReady.current) return;
    if (recommendedRoute) {
      sendToMap(webViewRef, {
        type: 'SET_RECOMMENDED_ROUTE',
        route: recommendedRoute,
      });
    } else {
      sendToMap(webViewRef, {
        type: 'CLEAR_RECOMMENDED_ROUTE',
      });
    }
  }, [recommendedRoute]);

  // Update road segments GeoJSON
  useEffect(() => {
    if (!isMapReady.current || !roadSegmentsGeoJSON) return;
    sendToMap(webViewRef, {
      type: 'SET_ROAD_SEGMENTS',
      geojson: roadSegmentsGeoJSON,
    });
  }, [roadSegmentsGeoJSON]);

  // Toggle safety heatmap
  useEffect(() => {
    if (!isMapReady.current) return;
    sendToMap(webViewRef, {
      type: 'TOGGLE_SAFETY_HEATMAP',
      enabled: showSafetyHeatmap,
    });
  }, [showSafetyHeatmap]);

  return (
    <View style={[styles.container, { width: width || '100%', height: height || '100%' }]}>
      <WebView
        ref={webViewRef}
        source={htmlSource}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={false}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        textInteractionEnabled={false}
      />
    </View>
  );
});

export default TomTomMap;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0A0A0F',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
