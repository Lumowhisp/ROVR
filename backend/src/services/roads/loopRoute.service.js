import { RoadSegment } from "../../models/roadSegment.model.js";
import { calculateSafetyScore } from "./safetyScoring.service.js";
import { calculateDistanceMeters } from "./geoUtils.service.js";

const VALID_MODES = new Set(["walking", "running", "cycling"]);
const NODE_PRECISION = 6;

const segmentsCache = new Map();

export async function generateLoopRoute({
  lat,
  lng,
  distanceKm,
  mode = "walking",
  areaKey = "kp3",
  tolerance = 0.25,
} = {}) {
  const startPoint = validateLoopRequest({ lat, lng, distanceKm, mode });
  let segments = segmentsCache.get(areaKey);
  if (!segments) {
    segments = await RoadSegment.find({ areaKey }).select("-__v").lean();
    if (segments.length > 0) {
      segmentsCache.set(areaKey, segments);
    }
  }

  return generateLoopRouteFromSegments({
    startPoint,
    distanceKm,
    mode,
    areaKey,
    tolerance,
    segments,
  });
}

export function generateLoopRouteFromSegments({
  startPoint,
  distanceKm,
  mode = "walking",
  areaKey = "kp3",
  tolerance = 0.25,
  segments = [],
} = {}) {
  const targetMeters = distanceKm * 1000;

  if (segments.length === 0) {
    throw new Error(`No road segments found for areaKey=${areaKey}`);
  }

  const graph = buildRoadGraph(segments, mode);
  const startNode = findNearestNode(graph, startPoint);
  const maxDistanceMeters = targetMeters * (1 + tolerance);
  const minDistanceMeters = targetMeters * (1 - tolerance);

  const candidates = generateLoopCandidates({
    graph,
    startNode,
    targetMeters,
    maxDistanceMeters,
    mode,
  });

  const validCandidates = candidates
    .filter((candidate) => candidate.distanceMeters >= minDistanceMeters)
    .sort((a, b) => b.score - a.score);

  let best = validCandidates[0] || candidates.sort((a, b) => b.score - a.score)[0];
  if (!best) {
    // Fallback: build safest out-and-back route to guarantee a valid loop route
    const halfTarget = Math.max(250, targetMeters * 0.5);
    const startEdges = [...startNode.edges].sort(compareEdges);
    if (startEdges.length > 0) {
      const outbound = buildOutboundPath({
        graph,
        startKey: startNode.key,
        firstEdge: startEdges[0],
        targetOutboundMeters: halfTarget,
        maxDistanceMeters: halfTarget * 1.5,
      });
      if (outbound.edges.length > 0) {
        const returnEdges = [...outbound.edges].reverse().map((e) => ({
          ...e,
          start: e.end,
          end: e.start,
          fromKey: e.toKey,
          toKey: e.fromKey,
        }));
        best = buildRouteCandidate({
          startNode,
          routeEdges: [...outbound.edges, ...returnEdges],
          targetMeters,
        });
      }
    }
  }

  if (!best) {
    throw new Error("Could not generate a loop route from the nearby road network");
  }

  const startConnectorMeters = calculateDistanceMeters(startPoint, startNode.point);
  const coordinates = [
    [startPoint.lng, startPoint.lat],
    ...best.coordinates,
    [startPoint.lng, startPoint.lat],
  ];

  return {
    type: "Feature",
    properties: {
      areaKey,
      mode,
      requestedDistanceKm: distanceKm,
      distanceMeters: Math.round(best.distanceMeters + startConnectorMeters * 2),
      distanceKm: Number(((best.distanceMeters + startConnectorMeters * 2) / 1000).toFixed(2)),
      targetDeltaMeters: Math.round(
        best.distanceMeters + startConnectorMeters * 2 - targetMeters
      ),
      safetyScore: roundScore(best.averageSafetyScore),
      segmentCount: best.segmentIds.length,
      segmentIds: best.segmentIds,
      startSnapDistanceMeters: Math.round(startConnectorMeters),
    },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

export function buildRoadGraph(segments, mode = "walking") {
  const nodes = new Map();
  const edges = [];

  for (const segment of segments) {
    if (!isModeAllowed(segment, mode)) {
      continue;
    }

    const start = segment.start;
    const end = segment.end;
    if (!start || !end) {
      continue;
    }

    const startKey = pointKey(start);
    const endKey = pointKey(end);
    const safetyScore = calculateSafetyScore(segment, mode);
    const edge = {
      id: segment.segmentId,
      roadName: segment.roadName,
      roadType: segment.roadType,
      startKey,
      endKey,
      start,
      end,
      lengthMeters: segment.lengthMeters,
      safetyScore,
      traversalCost: segment.lengthMeters * (1.35 - safetyScore),
    };

    upsertNode(nodes, startKey, start);
    upsertNode(nodes, endKey, end);
    edges.push(edge);
  }

  for (const node of nodes.values()) {
    node.edges = [];
  }

  for (const edge of edges) {
    nodes.get(edge.startKey)?.edges.push({ ...edge, fromKey: edge.startKey, toKey: edge.endKey });
    nodes.get(edge.endKey)?.edges.push({
      ...edge,
      fromKey: edge.endKey,
      toKey: edge.startKey,
      start: edge.end,
      end: edge.start,
    });
  }

  return {
    nodes,
    edges,
  };
}

function generateLoopCandidates({
  graph,
  startNode,
  targetMeters,
  maxDistanceMeters,
}) {
  const startEdges = [...startNode.edges]
    .sort(compareEdges)
    .slice(0, 8);
  const candidates = [];

  for (const firstEdge of startEdges) {
    const outbound = buildOutboundPath({
      graph,
      startKey: startNode.key,
      firstEdge,
      targetOutboundMeters: targetMeters * 0.58,
      maxDistanceMeters,
    });

    if (outbound.edges.length === 0) {
      continue;
    }

    let returnPath = findShortestPath(graph, outbound.currentKey, startNode.key, {
      bannedEdgeIds: new Set(outbound.edges.map((edge) => edge.id)),
      maxDistanceMeters: Math.max(targetMeters * 0.7, targetMeters - outbound.distanceMeters + 500),
    });

    if (!returnPath) {
      // Fallback: allow returning via same road if strict loop isn't closed
      returnPath = findShortestPath(graph, outbound.currentKey, startNode.key, {
        maxDistanceMeters: Math.max(targetMeters * 0.7, targetMeters - outbound.distanceMeters + 800),
      });
    }

    if (!returnPath) {
      continue;
    }

    const routeEdges = [...outbound.edges, ...returnPath.edges];
    const distanceMeters = sumDistance(routeEdges);
    if (distanceMeters > maxDistanceMeters) {
      continue;
    }

    candidates.push(buildRouteCandidate({
      startNode,
      routeEdges,
      targetMeters,
    }));
  }

  return candidates;
}

function buildOutboundPath({
  graph,
  startKey,
  firstEdge,
  targetOutboundMeters,
  maxDistanceMeters,
}) {
  const visitedEdges = new Set();
  const visitedNodes = new Set([startKey]);
  const edges = [];
  let currentKey = startKey;
  let distanceMeters = 0;
  let maxSteps = 200;

  let nextEdge = firstEdge;
  while (nextEdge && distanceMeters < targetOutboundMeters && maxSteps-- > 0) {
    edges.push(nextEdge);
    visitedEdges.add(nextEdge.id);
    distanceMeters += nextEdge.lengthMeters;
    currentKey = nextEdge.toKey;
    visitedNodes.add(currentKey);

    const currentNode = graph.nodes.get(currentKey);
    if (!currentNode || !Array.isArray(currentNode.edges)) {
      break;
    }
    const remainingBudget = maxDistanceMeters - distanceMeters;
    nextEdge = currentNode.edges
      .filter((edge) => !visitedEdges.has(edge.id))
      .filter((edge) => edge.lengthMeters <= remainingBudget)
      .filter((edge) => !visitedNodes.has(edge.toKey) || distanceMeters > targetOutboundMeters * 0.7)
      .sort(compareEdges)[0];
  }

  return {
    currentKey,
    distanceMeters,
    edges,
  };
}

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }
  push(item) {
    this.heap.push(item);
    this._up(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._down(0);
    }
    return top;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[i].distance >= this.heap[p].distance) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }
  _down(i) {
    const len = this.heap.length;
    while (true) {
      let smallest = i;
      const l = (i << 1) + 1;
      const r = l + 1;
      if (l < len && this.heap[l].distance < this.heap[smallest].distance) smallest = l;
      if (r < len && this.heap[r].distance < this.heap[smallest].distance) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
  get length() {
    return this.heap.length;
  }
}

function findShortestPath(
  graph,
  sourceKey,
  targetKey,
  { bannedEdgeIds = new Set(), maxDistanceMeters = Infinity } = {}
) {
  const distances = new Map([[sourceKey, 0]]);
  const previous = new Map();
  const queue = new MinPriorityQueue();
  queue.push({ key: sourceKey, distance: 0 });

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) break;

    if (current.key === targetKey) {
      break;
    }
    if (current.distance > (distances.get(current.key) ?? Infinity)) {
      continue;
    }
    if (current.distance > maxDistanceMeters) {
      continue;
    }

    const node = graph.nodes.get(current.key);
    if (!node) {
      continue;
    }

    for (const edge of node.edges) {
      if (bannedEdgeIds.has(edge.id)) {
        continue;
      }

      const nextDistance = current.distance + edge.traversalCost;
      if (nextDistance > maxDistanceMeters) {
        continue;
      }
      if (nextDistance >= (distances.get(edge.toKey) ?? Infinity)) {
        continue;
      }

      distances.set(edge.toKey, nextDistance);
      previous.set(edge.toKey, { edge, previousKey: current.key });
      queue.push({ key: edge.toKey, distance: nextDistance });
    }
  }

  if (!previous.has(targetKey) && sourceKey !== targetKey) {
    return null;
  }

  const edges = [];
  let currentKey = targetKey;
  while (currentKey !== sourceKey) {
    const step = previous.get(currentKey);
    if (!step) {
      return null;
    }
    edges.unshift(step.edge);
    currentKey = step.previousKey;
  }

  return {
    edges,
    distanceMeters: sumDistance(edges),
  };
}

function buildRouteCandidate({ startNode, routeEdges, targetMeters }) {
  const coordinates = [[startNode.point.lng, startNode.point.lat]];
  const segmentIds = [];
  let safetySum = 0;
  let weightedSafetySum = 0;
  let distanceMeters = 0;

  for (const edge of routeEdges) {
    coordinates.push([edge.end.lng, edge.end.lat]);
    segmentIds.push(edge.id);
    safetySum += edge.safetyScore;
    weightedSafetySum += edge.safetyScore * edge.lengthMeters;
    distanceMeters += edge.lengthMeters;
  }

  const distanceFit = 1 - Math.min(1, Math.abs(distanceMeters - targetMeters) / targetMeters);
  const averageSafetyScore =
    distanceMeters > 0 ? weightedSafetySum / distanceMeters : safetySum / routeEdges.length;

  return {
    coordinates,
    segmentIds,
    distanceMeters,
    averageSafetyScore,
    score: averageSafetyScore * 0.7 + distanceFit * 0.3,
  };
}

function findNearestNode(graph, point) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const node of graph.nodes.values()) {
    const distance = calculateDistanceMeters(point, node.point);
    if (distance < nearestDistance) {
      nearest = node;
      nearestDistance = distance;
    }
  }

  if (!nearest) {
    throw new Error("No usable road graph nodes found");
  }

  return nearest;
}

function isModeAllowed(segment, mode) {
  const roadType = segment.roadType;
  if (["motorway", "trunk"].includes(roadType)) {
    return false;
  }
  if ((mode === "walking" || mode === "running") && roadType === "primary") {
    return Boolean(segment.hasSidewalk || segment.isServiceLane);
  }
  if (mode === "cycling" && ["footway", "pedestrian"].includes(roadType)) {
    return Boolean(segment.hasCycleLane);
  }

  return true;
}

function compareEdges(a, b) {
  if (b.safetyScore !== a.safetyScore) {
    return b.safetyScore - a.safetyScore;
  }

  return a.lengthMeters - b.lengthMeters;
}

function sumDistance(edges) {
  return edges.reduce((sum, edge) => sum + edge.lengthMeters, 0);
}

function validateLoopRequest({ lat, lng, distanceKm, mode }) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const parsedDistanceKm = Number(distanceKm);

  if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    throw new Error("lat must be a valid latitude");
  }
  if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    throw new Error("lng must be a valid longitude");
  }
  if (
    !Number.isFinite(parsedDistanceKm) ||
    parsedDistanceKm < 0.5 ||
    parsedDistanceKm > 50
  ) {
    throw new Error("distanceKm must be between 0.5 and 50");
  }
  if (!VALID_MODES.has(mode)) {
    throw new Error("mode must be walking, running, or cycling");
  }

  return {
    lat: parsedLat,
    lng: parsedLng,
  };
}

function pointKey(point) {
  return `${Number(point.lat).toFixed(NODE_PRECISION)},${Number(point.lng).toFixed(
    NODE_PRECISION
  )}`;
}

function upsertNode(nodes, key, point) {
  if (!nodes.has(key)) {
    nodes.set(key, {
      key,
      point,
      edges: [],
    });
  }
}

function roundScore(value) {
  return Number(Math.min(1, Math.max(0, value)).toFixed(3));
}
