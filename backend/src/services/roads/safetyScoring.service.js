const DEFAULT_FEATURE_SCORE = 0.5;

const TRAFFIC_BY_ROAD_TYPE = {
  motorway: 1,
  trunk: 0.95,
  primary: 0.85,
  secondary: 0.7,
  tertiary: 0.55,
  unclassified: 0.4,
  residential: 0.25,
  living_street: 0.15,
  service: 0.18,
  pedestrian: 0.05,
  footway: 0.02,
  path: 0.04,
  cycleway: 0.06,
};

const ROAD_TYPE_SCORE = {
  walking: {
    pedestrian: 1,
    footway: 1,
    path: 0.9,
    living_street: 0.88,
    service: 0.82,
    residential: 0.78,
    unclassified: 0.58,
    tertiary: 0.42,
    secondary: 0.28,
    primary: 0.16,
    trunk: 0.04,
    motorway: 0,
  },
  running: {
    pedestrian: 0.94,
    footway: 1,
    path: 0.92,
    living_street: 0.9,
    service: 0.88,
    residential: 0.82,
    cycleway: 0.74,
    unclassified: 0.55,
    tertiary: 0.34,
    secondary: 0.2,
    primary: 0.08,
    trunk: 0.02,
    motorway: 0,
  },
  cycling: {
    cycleway: 1,
    service: 0.8,
    residential: 0.78,
    living_street: 0.76,
    unclassified: 0.68,
    tertiary: 0.62,
    secondary: 0.42,
    path: 0.38,
    primary: 0.25,
    pedestrian: 0.16,
    footway: 0.08,
    trunk: 0.04,
    motorway: 0,
  },
};

const SAFETY_WEIGHTS = {
  police: 0.1,
  hospital: 0.08,
  building: 0.13,
  shop: 0.1,
  transit: 0.08,
  road: 0.22,
  traffic: 0.14,
  lighting: 0.07,
  crossing: 0.04,
  incidents: 0.04,
};

export function buildRoadSafetyProfile({ roadType, tags = {} }) {
  const speedLimitKph = parseSpeedLimit(tags.maxspeed);
  const trafficLevel = estimateTrafficLevel(roadType, tags);

  return {
    hasSidewalk: hasPositiveTag(tags.sidewalk) || hasPositiveTag(tags.footway),
    hasCycleLane: hasPositiveTag(tags.cycleway) || roadType === "cycleway",
    isServiceLane: roadType === "service" || tags.service === "driveway",
    isLit: hasPositiveTag(tags.lit),
    speedLimitKph,
    traffic: {
      estimatedLevel: trafficLevel,
      currentLevel: null,
      source: "osm_road_type_estimate",
      confidence: 0.45,
      updatedAt: null,
    },
  };
}

export function calculateModeScores(segment) {
  const trafficLevel = resolveTrafficLevel(segment.traffic);
  const trafficScore = 1 - trafficLevel;

  return {
    walking: calculateSafetyScore(segment, "walking", trafficScore),
    running: calculateSafetyScore(segment, "running", trafficScore),
    cycling: calculateSafetyScore(segment, "cycling", trafficScore),
  };
}

export function calculateSafetyScore(segment, mode = "walking", trafficScoreOverride) {
  const policeScore = distanceScore(segment.policeDistance, 1500);
  const hospitalScore = distanceScore(segment.hospitalDistance, 2500);
  const buildingScore = normalizedOrDefault(segment.buildingDensity);
  const shopScore = normalizedOrDefault(segment.shopDensity);
  const transitScore = normalizedOrDefault(segment.transitDensity);
  const lightingScore = normalizedOrDefault(segment.streetLightDensity);
  const crossingScore = normalizedOrDefault(segment.crossingDensity);
  const incidentScore = 1 - normalizedOrZero(segment.incidentRisk);
  const roadScore = calculateRoadCharacteristicScore(segment, mode);
  const trafficScore =
    trafficScoreOverride ?? 1 - resolveTrafficLevel(segment.traffic);

  return roundScore(
    SAFETY_WEIGHTS.police * policeScore +
      SAFETY_WEIGHTS.hospital * hospitalScore +
      SAFETY_WEIGHTS.building * buildingScore +
      SAFETY_WEIGHTS.shop * shopScore +
      SAFETY_WEIGHTS.transit * transitScore +
      SAFETY_WEIGHTS.road * roadScore +
      SAFETY_WEIGHTS.traffic * trafficScore +
      SAFETY_WEIGHTS.lighting * lightingScore +
      SAFETY_WEIGHTS.crossing * crossingScore +
      SAFETY_WEIGHTS.incidents * incidentScore
  );
}

export function calculateRoadCharacteristicScore(segment, mode = "walking") {
  const roadType = segment.roadType || "unknown";
  const base = ROAD_TYPE_SCORE[mode]?.[roadType] ?? 0.45;
  const trafficLevel = resolveTrafficLevel(segment.traffic);
  const speedLimitKph = segment.speedLimitKph;

  let score = base;

  if (segment.isServiceLane) {
    score += mode === "running" ? 0.14 : 0.1;
  }
  if (segment.hasSidewalk && (mode === "walking" || mode === "running")) {
    score += 0.12;
  }
  if (segment.hasCycleLane && mode === "cycling") {
    score += 0.18;
  }
  if (segment.isLit) {
    score += 0.06;
  }
  if (Number.isFinite(speedLimitKph)) {
    score -= speedLimitKph >= 60 ? 0.14 : 0;
    score -= speedLimitKph >= 80 ? 0.12 : 0;
  }
  if (trafficLevel >= 0.75) {
    score -= mode === "running" ? 0.22 : 0.16;
  }

  return roundScore(clamp(score));
}

export function estimateTrafficLevel(roadType, tags = {}) {
  let trafficLevel = TRAFFIC_BY_ROAD_TYPE[roadType] ?? 0.45;
  const lanes = Number(tags.lanes);
  const speedLimitKph = parseSpeedLimit(tags.maxspeed);

  if (Number.isFinite(lanes) && lanes >= 4) {
    trafficLevel += 0.12;
  }
  if (Number.isFinite(speedLimitKph) && speedLimitKph >= 60) {
    trafficLevel += 0.1;
  }
  if (roadType === "service" && tags.service === "parking_aisle") {
    trafficLevel -= 0.08;
  }

  return roundScore(clamp(trafficLevel));
}

export function resolveTrafficLevel(traffic = {}) {
  if (Number.isFinite(traffic.currentLevel)) {
    return clamp(traffic.currentLevel);
  }

  if (Number.isFinite(traffic.estimatedLevel)) {
    return clamp(traffic.estimatedLevel);
  }

  return 0.45;
}

function distanceScore(distanceMeters, usefulRangeMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return DEFAULT_FEATURE_SCORE;
  }

  return roundScore(clamp(1 - distanceMeters / usefulRangeMeters));
}

function normalizedOrDefault(value) {
  return Number.isFinite(value) ? clamp(value) : DEFAULT_FEATURE_SCORE;
}

function normalizedOrZero(value) {
  return Number.isFinite(value) ? clamp(value) : 0;
}

function hasPositiveTag(value) {
  return ["yes", "both", "left", "right", "lane", "track", "separate"].includes(
    String(value || "").toLowerCase()
  );
}

function parseSpeedLimit(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function roundScore(value) {
  return Number(clamp(value).toFixed(3));
}
