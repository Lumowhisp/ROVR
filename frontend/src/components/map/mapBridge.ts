/**
 * mapBridge.ts — Type-safe message protocol between React Native and TomTom WebView map
 */
import { RefObject } from 'react';
import type { WebView } from 'react-native-webview';
import type { LocationCoordinate } from '@/types/workout';

// ─── Message Types ───────────────────────────────────────────────────────────

export interface SafeRouteData {
  coordinates: [number, number][]; // [lng, lat][]
  distanceKm: number;
  safetyScore: number;
  mode?: string;
  segmentCount?: number;
}

/** Messages sent from React Native → WebView */
export type RNToMapMessage =
  | { type: 'CENTER_MAP'; latitude: number; longitude: number; zoom?: number; animate?: boolean }
  | { type: 'UPDATE_WALKING_PATH'; coordinates: [number, number][] }
  | { type: 'SET_RECOMMENDED_ROUTE'; route: SafeRouteData }
  | { type: 'CLEAR_RECOMMENDED_ROUTE' }
  | { type: 'SET_ROAD_SEGMENTS'; geojson: any }
  | { type: 'TOGGLE_SAFETY_HEATMAP'; enabled: boolean }
  | { type: 'ADD_START_MARKER'; latitude: number; longitude: number }
  | { type: 'UPDATE_USER_LOCATION'; latitude: number; longitude: number; heading?: number }
  | { type: 'CLEAR_OVERLAYS' };

/** Messages sent from WebView → React Native */
export type MapToRNMessage =
  | { type: 'MAP_READY' }
  | { type: 'USER_DRAG' }
  | { type: 'ROAD_SELECTED'; segmentId: string; roadName: string; safetyScore: number; trafficLevel: number | null }
  | { type: 'MAP_ERROR'; error: string };

// ─── Bridge Helpers ──────────────────────────────────────────────────────────

/**
 * Sends a strongly-typed message from React Native to the WebView map.
 */
export function sendToMap(
  webViewRef: RefObject<WebView | null>,
  message: RNToMapMessage
): void {
  if (!webViewRef.current) return;

  const js = `
    (function() {
      try {
        window.handleRNMessage(${JSON.stringify(message)});
      } catch(e) {
        console.log('Bridge error:', e);
      }
    })();
    true;
  `;
  webViewRef.current.injectJavaScript(js);
}

/**
 * Parses a message event from the WebView into a typed MapToRNMessage.
 * Returns null if the message is not a valid map message.
 */
export function parseMapMessage(eventData: string): MapToRNMessage | null {
  try {
    const parsed = JSON.parse(eventData);
    if (parsed && typeof parsed.type === 'string') {
      return parsed as MapToRNMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts LocationCoordinate[] to [lng, lat][] format expected by TomTom/Leaflet.
 * TomTom uses [lng, lat] order.
 */
export function coordsToTomTom(
  coordinates: LocationCoordinate[]
): [number, number][] {
  return coordinates.map((c) => [c.longitude, c.latitude]);
}

/**
 * Centers the map on a given location with optional zoom level.
 */
export function centerMap(
  webViewRef: RefObject<WebView | null>,
  location: LocationCoordinate,
  zoom?: number
): void {
  sendToMap(webViewRef, {
    type: 'CENTER_MAP',
    latitude: location.latitude,
    longitude: location.longitude,
    zoom,
    animate: true,
  });
}

/**
 * Updates the user's current position marker on the map.
 */
export function updateUserPosition(
  webViewRef: RefObject<WebView | null>,
  location: LocationCoordinate
): void {
  sendToMap(webViewRef, {
    type: 'UPDATE_USER_LOCATION',
    latitude: location.latitude,
    longitude: location.longitude,
  });
}

/**
 * Updates the walking path polyline on the map.
 */
export function updateWalkingPath(
  webViewRef: RefObject<WebView | null>,
  coordinates: LocationCoordinate[]
): void {
  sendToMap(webViewRef, {
    type: 'UPDATE_WALKING_PATH',
    coordinates: coordsToTomTom(coordinates),
  });
}

/**
 * Adds the start marker to the map.
 */
export function addStartMarker(
  webViewRef: RefObject<WebView | null>,
  location: LocationCoordinate
): void {
  sendToMap(webViewRef, {
    type: 'ADD_START_MARKER',
    latitude: location.latitude,
    longitude: location.longitude,
  });
}
