import { RoadSegment } from "../../models/roadSegment.model.js";
import { calculateModeScores } from "./safetyScoring.service.js";
import { calculateDistanceMeters, getSegmentMidpoint } from "./geoUtils.service.js";

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_RADIUS_METERS = 200;

export function buildFeatureQuery({ south, west, north, east }) {
  return `
[out:json][timeout:45];
(
  nwr["amenity"~"^(police|hospital|clinic|doctors|pharmacy)$"](${south},${west},${north},${east});
  nwr["shop"](${south},${west},${north},${east});
  nwr["public_transport"](${south},${west},${north},${east});
  nwr["highway"~"^(bus_stop|crossing|street_lamp)$"](${south},${west},${north},${east});
  way["building"](${south},${west},${north},${east});
);
out tags center;
`.trim();
}

export async function fetchOsmSafetyFeatures({
  bbox,
  overpassUrl = DEFAULT_OVERPASS_URL,
} = {}) {
  if (!bbox) {
    throw new Error("bbox is required");
  }

  const query = buildFeatureQuery(bbox);
  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "ROVR-osm-feature-enrichment/1.0",
    },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass feature request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return normalizeOsmFeatures(data.elements || []);
}

export async function enrichRoadSegmentsWithOsmFeatures({
  areaKey = "kp3",
  bbox,
  overpassUrl = DEFAULT_OVERPASS_URL,
  radiusMeters = DEFAULT_RADIUS_METERS,
} = {}) {
  const features = await fetchOsmSafetyFeatures({ bbox, overpassUrl });
  const segments = await RoadSegment.find({ areaKey });

  let updated = 0;
  for (const segment of segments) {
    applyFeatureScores(segment, features, { radiusMeters });
    segment.modeScores = calculateModeScores(segment);
    segment.safetyScore = segment.modeScores.walking;
    await segment.save();
    updated += 1;
  }

  return {
    areaKey,
    features: features.length,
    segments: updated,
  };
}

export function applyFeatureScores(segment, features, { radiusMeters = 200 } = {}) {
  const midpoint = getSegmentMidpoint(segment);
  const nearby = features
    .map((feature) => ({
      ...feature,
      distanceMeters: calculateDistanceMeters(midpoint, feature.point),
    }))
    .filter((feature) => feature.distanceMeters <= radiusMeters);

  const policeDistances = nearby
    .filter((feature) => feature.kind === "police")
    .map((feature) => feature.distanceMeters);
  const hospitalDistances = nearby
    .filter((feature) => feature.kind === "hospital")
    .map((feature) => feature.distanceMeters);

  segment.policeDistance = minOrNull(policeDistances);
  segment.hospitalDistance = minOrNull(hospitalDistances);
  segment.buildingDensity = densityScore(nearby, "building", 35);
  segment.shopDensity = densityScore(nearby, "shop", 18);
  segment.transitDensity = densityScore(nearby, "transit", 8);
  segment.crossingDensity = densityScore(nearby, "crossing", 6);
  segment.streetLightDensity = densityScore(nearby, "street_light", 12);

  if (segment.streetLightDensity > 0) {
    segment.isLit = true;
  }
}

function normalizeOsmFeatures(elements) {
  return elements
    .map((element) => {
      const point = getElementPoint(element);
      const kind = classifyFeature(element.tags || {});
      if (!point || !kind) {
        return null;
      }

      return {
        osmId: element.id,
        osmType: element.type,
        kind,
        point,
      };
    })
    .filter(Boolean);
}

function classifyFeature(tags) {
  if (tags.amenity === "police") {
    return "police";
  }
  if (["hospital", "clinic", "doctors", "pharmacy"].includes(tags.amenity)) {
    return "hospital";
  }
  if (tags.shop) {
    return "shop";
  }
  if (tags.public_transport || tags.highway === "bus_stop") {
    return "transit";
  }
  if (tags.highway === "crossing") {
    return "crossing";
  }
  if (tags.highway === "street_lamp") {
    return "street_light";
  }
  if (tags.building) {
    return "building";
  }

  return null;
}

function getElementPoint(element) {
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { lat: element.lat, lng: element.lon };
  }
  if (
    Number.isFinite(element.center?.lat) &&
    Number.isFinite(element.center?.lon)
  ) {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  return null;
}

function densityScore(features, kind, maxUsefulCount) {
  const count = features.filter((feature) => feature.kind === kind).length;
  return Number(Math.min(1, count / maxUsefulCount).toFixed(3));
}

function minOrNull(values) {
  return values.length > 0 ? Number(Math.min(...values).toFixed(2)) : null;
}
