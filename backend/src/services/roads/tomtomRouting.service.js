/**
 * TomTom Calculate Route API integration.
 *
 * Instead of stitching local OSM segments (which may be sparse/disconnected),
 * this service sends waypoints to TomTom's routing engine and receives
 * real, road-snapped coordinates that always follow actual roads.
 */

const TOMTOM_ROUTE_URL =
  "https://api.tomtom.com/routing/1/calculateRoute";

const TRAVEL_MODE_MAP = {
  walking: "pedestrian",
  running: "pedestrian",
  cycling: "bicycle",
};

/**
 * Generate a road-snapped loop route via TomTom Calculate Route API.
 *
 * Strategy:
 *  1. Scatter N waypoints in a roughly circular pattern around the start
 *  2. Send start → wp1 → wp2 → … → start to TomTom
 *  3. TomTom returns full road-snapped geometry for each leg
 *
 * @param {{ lat: number, lng: number }} startPoint
 * @param {number} distanceKm  Desired loop distance (km)
 * @param {"walking"|"running"|"cycling"} mode
 * @param {string} apiKey  TomTom API key
 * @returns {Promise<{ coordinates: number[][], distanceMeters: number, travelTimeSeconds: number }>}
 */
export async function generateTomTomLoopRoute({
  startPoint,
  distanceKm,
  mode = "walking",
  apiKey,
}) {
  if (!apiKey) {
    throw new Error("TOMTOM_API_KEY is required for routing");
  }

  const travelMode = TRAVEL_MODE_MAP[mode] || "pedestrian";

  // --- Build waypoints in a loop pattern ---
  // Radius = targetDistance / (2π) with slight padding to hit the target
  const radiusKm = distanceKm / (2 * Math.PI * 1.15);
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((startPoint.lat * Math.PI) / 180));

  // Use more waypoints for longer routes to get a rounder loop
  const waypointCount = distanceKm <= 1.5 ? 3 : distanceKm <= 5 ? 4 : 5;

  // Spread waypoints evenly around the circle with a random rotation offset
  // so routes aren't always pointing the same direction
  const offsetDeg = Math.random() * 360;
  const angleStep = 360 / waypointCount;

  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    const angleDeg = offsetDeg + i * angleStep;
    const angleRad = (angleDeg * Math.PI) / 180;
    const wpLat = startPoint.lat + latDelta * Math.sin(angleRad);
    const wpLng = startPoint.lng + lngDelta * Math.cos(angleRad);
    waypoints.push(`${wpLat.toFixed(6)},${wpLng.toFixed(6)}`);
  }

  const locations = [
    `${startPoint.lat},${startPoint.lng}`,
    ...waypoints,
    `${startPoint.lat},${startPoint.lng}`,
  ].join(":");

  const url = new URL(`${TOMTOM_ROUTE_URL}/${locations}/json`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("travelMode", travelMode);
  url.searchParams.set("routeType", "fastest");
  url.searchParams.set("traffic", "true");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `TomTom routing failed (${response.status}): ${text.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route || !route.legs) {
    throw new Error("TomTom returned no valid route");
  }

  // Stitch leg points into a single coordinate array [lng, lat] (GeoJSON order)
  const coordinates = [];
  let totalDistanceMeters = 0;
  let totalTravelTimeSeconds = 0;

  for (const leg of route.legs) {
    totalDistanceMeters += leg.summary?.lengthInMeters || 0;
    totalTravelTimeSeconds += leg.summary?.travelTimeInSeconds || 0;

    for (const point of leg.points || []) {
      coordinates.push([point.longitude, point.latitude]);
    }
  }

  // Close the loop — ensure first and last point match
  if (coordinates.length > 0) {
    coordinates.push([startPoint.lng, startPoint.lat]);
  }

  return {
    coordinates,
    distanceMeters: totalDistanceMeters,
    travelTimeSeconds: totalTravelTimeSeconds,
  };
}
