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
/**
 * Generate a road-snapped loop route via TomTom Calculate Route API.
 *
 * Strategy:
 *  1. Calibrate radial distance based on target km
 *  2. Try multiple angular orientations to find the smoothest loop
 *  3. TomTom returns full road-snapped geometry that starts and finishes at startPoint
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
  const parsedDistKm = Number(distanceKm) || 2.0;

  // Calibrate winding factor according to target distance
  const windingFactor =
    parsedDistKm <= 1.5 ? 0.95 : parsedDistKm <= 4.0 ? 1.45 : parsedDistKm <= 7.0 ? 1.25 : 1.25;
  const waypointCount = parsedDistKm <= 2.0 ? 3 : parsedDistKm <= 7.0 ? 4 : 5;

  const radiusKm = Math.max(0.15, parsedDistKm / (2 * Math.PI * windingFactor));
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((startPoint.lat * Math.PI) / 180));

  // Try standard orientation angles: 0, 45, 90 deg until a valid road loop is found
  const candidateAngles = [0, 45, 90, 135];
  let lastError = null;

  for (const offsetDeg of candidateAngles) {
    try {
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
        continue;
      }

      const data = await response.json();
      const route = data.routes?.[0];
      if (!route || !Array.isArray(route.legs) || route.legs.length === 0) {
        continue;
      }

      // Stitch leg points into a single coordinate array [lng, lat]
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

      if (coordinates.length >= 3) {
        coordinates.push([startPoint.lng, startPoint.lat]);
        return {
          coordinates,
          distanceMeters: totalDistanceMeters,
          travelTimeSeconds: totalTravelTimeSeconds,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Could not calculate a connected loop route from this location");
}
