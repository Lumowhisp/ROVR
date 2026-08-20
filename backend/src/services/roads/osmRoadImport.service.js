import { RoadSegment } from "../../models/roadSegment.model.js";
import {
  buildRoadSafetyProfile,
  calculateModeScores,
  calculateSafetyScore,
} from "./safetyScoring.service.js";

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export const KP3_BBOX = {
  south: 28.452,
  west: 77.49,
  north: 28.475,
  east: 77.515,
};

export function buildRoadNetworkQuery({
  south = KP3_BBOX.south,
  west = KP3_BBOX.west,
  north = KP3_BBOX.north,
  east = KP3_BBOX.east,
} = {}) {
  return `
[out:json][timeout:30];
(
  way
    ["highway"]
    ["highway"!~"^(steps|corridor|proposed|construction|raceway)$"]
    (${south},${west},${north},${east});
);
out tags geom;
`.trim();
}

export async function fetchRoadWaysFromOverpass({
  overpassUrl = DEFAULT_OVERPASS_URL,
  bbox = KP3_BBOX,
} = {}) {
  const query = buildRoadNetworkQuery(bbox);
  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "ROVR-road-import/1.0",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data.elements)
    ? data.elements.filter((element) => element.type === "way")
    : [];
}

export function segmentRoadWays(ways, { areaKey = "kp3" } = {}) {
  const segments = [];

  for (const way of ways) {
    if (!Array.isArray(way.geometry) || way.geometry.length < 2) {
      continue;
    }

    const roadName = way.tags?.name || "Unnamed Road";
    const roadType = way.tags?.highway || "unknown";
    const roadSafetyProfile = buildRoadSafetyProfile({
      roadType,
      tags: way.tags || {},
    });

    for (let index = 0; index < way.geometry.length - 1; index += 1) {
      const start = way.geometry[index];
      const end = way.geometry[index + 1];

      if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
        continue;
      }

      const lengthMeters = calculateDistanceMeters(start, end);
      if (lengthMeters === 0) {
        continue;
      }

      const segment = {
        segmentId: `${areaKey}_${way.id}_${index}`,
        areaKey,
        roadName,
        roadType,
        osmTags: stringifyTags(way.tags),
        lengthMeters,
        start: {
          lat: start.lat,
          lng: start.lon,
        },
        end: {
          lat: end.lat,
          lng: end.lon,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [start.lon, start.lat],
            [end.lon, end.lat],
          ],
        },
        ...roadSafetyProfile,
        source: {
          provider: "openstreetmap",
          osmWayId: way.id,
          osmSegmentIndex: index,
        },
        policeDistance: null,
        hospitalDistance: null,
        buildingDensity: null,
        shopDensity: null,
        transitDensity: null,
        crossingDensity: null,
        streetLightDensity: null,
        incidentRisk: null,
        incidentCountNearby: 0,
        nearestIncidentDistance: null,
        safetyScore: null,
        modeScores: {
          walking: null,
          running: null,
          cycling: null,
        },
        popularityScore: null,
      };

      const modeScores = calculateModeScores(segment);
      segment.modeScores = modeScores;
      segment.safetyScore = modeScores.walking;

      segments.push(segment);
    }
  }

  return segments;
}

export async function importRoadSegments({
  areaKey = "kp3",
  bbox = KP3_BBOX,
  overpassUrl = DEFAULT_OVERPASS_URL,
  replaceExisting = true,
} = {}) {
  const ways = await fetchRoadWaysFromOverpass({ bbox, overpassUrl });
  const segments = segmentRoadWays(ways, { areaKey });

  if (replaceExisting) {
    await RoadSegment.deleteMany({ areaKey });
  }

  if (segments.length > 0) {
    await RoadSegment.bulkWrite(
      segments.map((segment) => ({
        updateOne: {
          filter: { segmentId: segment.segmentId },
          update: { $set: segment },
          upsert: true,
        },
      }))
    );
  }

  return {
    areaKey,
    ways: ways.length,
    segments: segments.length,
  };
}

export async function listRoadSegments({ areaKey = "kp3" } = {}) {
  return RoadSegment.find({ areaKey })
    .sort({ segmentId: 1 })
    .select("-__v")
    .lean();
}

export async function updateRoadSegmentTraffic({
  segmentId,
  currentLevel,
  source = "manual",
  confidence = 0.7,
  currentSpeedKph = null,
  freeFlowSpeedKph = null,
  roadClosure = false,
} = {}) {
  if (!segmentId) {
    throw new Error("segmentId is required");
  }
  if (!Number.isFinite(currentLevel) || currentLevel < 0 || currentLevel > 1) {
    throw new Error("currentLevel must be a number between 0 and 1");
  }

  const segment = await RoadSegment.findOne({ segmentId });
  if (!segment) {
    throw new Error("Road segment not found");
  }

  segment.traffic = {
    ...segment.traffic?.toObject?.(),
    currentLevel,
    source,
    confidence,
    currentSpeedKph,
    freeFlowSpeedKph,
    roadClosure,
    updatedAt: new Date(),
  };
  segment.modeScores = calculateModeScores(segment);
  segment.safetyScore = segment.modeScores.walking;

  await segment.save();
  return segment.toObject();
}

export function roadSegmentsToFeatureCollection(segments, { mode = "walking" } = {}) {
  return {
    type: "FeatureCollection",
    features: segments.map((segment) => ({
      type: "Feature",
      id: segment.segmentId,
      properties: {
        segmentId: segment.segmentId,
        roadName: segment.roadName,
        roadType: segment.roadType,
        lengthMeters: segment.lengthMeters,
        isServiceLane: segment.isServiceLane,
        hasSidewalk: segment.hasSidewalk,
        hasCycleLane: segment.hasCycleLane,
        trafficLevel:
          segment.traffic?.currentLevel ?? segment.traffic?.estimatedLevel ?? null,
        incidentRisk: segment.incidentRisk,
        incidentCountNearby: segment.incidentCountNearby,
        nearestIncidentDistance: segment.nearestIncidentDistance,
        buildingDensity: segment.buildingDensity,
        shopDensity: segment.shopDensity,
        transitDensity: segment.transitDensity,
        crossingDensity: segment.crossingDensity,
        streetLightDensity: segment.streetLightDensity,
        safetyScore: segment.safetyScore,
        selectedSafetyScore: calculateSafetyScore(segment, mode),
        mode,
        modeScores: segment.modeScores,
        osmWayId: segment.source?.osmWayId,
        osmSegmentIndex: segment.source?.osmSegmentIndex,
      },
      geometry: segment.geometry,
    })),
  };
}

function isValidCoordinate(point) {
  return (
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lon) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lon >= -180 &&
    point.lon <= 180
  );
}

function stringifyTags(tags = {}) {
  return Object.fromEntries(
    Object.entries(tags).map(([key, value]) => [key, String(value)])
  );
}

function calculateDistanceMeters(start, end) {
  const earthRadiusMeters = 6371000;
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lon - start.lon);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusMeters * c).toFixed(2));
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
