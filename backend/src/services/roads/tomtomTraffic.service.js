import {
  calculateDistanceMeters,
  coordinatesToPoint,
  getSegmentMidpoint,
} from "./geoUtils.service.js";

const TOMTOM_FLOW_SEGMENT_URL =
  "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json";
const TOMTOM_INCIDENTS_URL =
  "https://api.tomtom.com/traffic/services/5/incidentDetails";

export async function fetchTomTomTrafficForSegment(segment, { apiKey } = {}) {
  if (!apiKey) {
    throw new Error("TOMTOM_API_KEY is required");
  }

  const midpoint = getSegmentMidpoint(segment);
  const url = new URL(TOMTOM_FLOW_SEGMENT_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("point", `${midpoint.lat},${midpoint.lng}`);
  url.searchParams.set("unit", "KMPH");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TomTom traffic request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return normalizeTomTomFlow(data.flowSegmentData);
}

export function normalizeTomTomFlow(flowSegmentData = {}) {
  const currentSpeedKph = Number(flowSegmentData.currentSpeed);
  const freeFlowSpeedKph = Number(flowSegmentData.freeFlowSpeed);
  const confidence = Number(flowSegmentData.confidence);
  const roadClosure = Boolean(flowSegmentData.roadClosure);

  let currentLevel = null;
  if (roadClosure) {
    currentLevel = 1;
  } else if (
    Number.isFinite(currentSpeedKph) &&
    Number.isFinite(freeFlowSpeedKph) &&
    freeFlowSpeedKph > 0
  ) {
    currentLevel = clamp(1 - currentSpeedKph / freeFlowSpeedKph);
  }

  return {
    currentLevel: currentLevel === null ? null : roundScore(currentLevel),
    currentSpeedKph: Number.isFinite(currentSpeedKph) ? currentSpeedKph : null,
    freeFlowSpeedKph: Number.isFinite(freeFlowSpeedKph) ? freeFlowSpeedKph : null,
    confidence: Number.isFinite(confidence) ? clamp(confidence) : 0.5,
    roadClosure,
    source: "tomtom_flow_segment",
  };
}

export async function fetchTomTomIncidentsForBbox({ bbox, apiKey } = {}) {
  if (!apiKey) {
    throw new Error("TOMTOM_API_KEY is required");
  }
  if (!bbox) {
    throw new Error("bbox is required");
  }

  const url = new URL(TOMTOM_INCIDENTS_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("bbox", `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`);
  url.searchParams.set(
    "fields",
    "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,iconCategory},length,delay,roadNumbers}}}"
  );
  url.searchParams.set("language", "en-GB");
  url.searchParams.set("timeValidityFilter", "present");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TomTom incidents request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return normalizeTomTomIncidents(data.incidents || []);
}

export function normalizeTomTomIncidents(incidents = []) {
  return incidents
    .map((incident) => {
      const points = extractIncidentPoints(incident.geometry);
      if (points.length === 0) {
        return null;
      }

      const properties = incident.properties || {};
      return {
        id: properties.id,
        iconCategory: Number(properties.iconCategory),
        magnitudeOfDelay: Number(properties.magnitudeOfDelay),
        delaySeconds: Number(properties.delay) || 0,
        lengthMeters: Number(properties.length) || 0,
        points,
        severity: calculateIncidentSeverity(properties),
      };
    })
    .filter(Boolean);
}

export function calculateIncidentRiskForSegment(
  segment,
  incidents,
  { radiusMeters = 200 } = {}
) {
  const midpoint = getSegmentMidpoint(segment);
  const nearby = incidents
    .map((incident) => {
      const distanceMeters = Math.min(
        ...incident.points.map((point) => calculateDistanceMeters(midpoint, point))
      );
      return { ...incident, distanceMeters };
    })
    .filter((incident) => incident.distanceMeters <= radiusMeters);

  if (nearby.length === 0) {
    return {
      incidentRisk: 0,
      incidentCountNearby: 0,
      nearestIncidentDistance: null,
    };
  }

  const maxRisk = Math.max(
    ...nearby.map((incident) => {
      const distanceFactor = 1 - incident.distanceMeters / radiusMeters;
      return incident.severity * distanceFactor;
    })
  );

  return {
    incidentRisk: roundScore(maxRisk),
    incidentCountNearby: nearby.length,
    nearestIncidentDistance: Number(
      Math.min(...nearby.map((incident) => incident.distanceMeters)).toFixed(2)
    ),
  };
}

function extractIncidentPoints(geometry = {}) {
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    return [coordinatesToPoint(geometry.coordinates)];
  }

  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.map(coordinatesToPoint);
  }

  if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.flat().map(coordinatesToPoint);
  }

  return [];
}

function calculateIncidentSeverity(properties = {}) {
  const category = Number(properties.iconCategory);
  const delayMagnitude = Number(properties.magnitudeOfDelay);

  if (category === 8) {
    return 1;
  }
  if (category === 1) {
    return 0.9;
  }
  if ([3, 7, 9, 11].includes(category)) {
    return 0.75;
  }
  if (category === 6) {
    return 0.65;
  }
  if (Number.isFinite(delayMagnitude) && delayMagnitude >= 3) {
    return 0.7;
  }

  return 0.45;
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function roundScore(value) {
  return Number(clamp(value).toFixed(3));
}
