import express from "express";
import { protect } from "../Middleware/protect.js";
import {
  listRoadSegments,
  roadSegmentsToFeatureCollection,
  updateRoadSegmentTraffic,
} from "../services/roads/osmRoadImport.service.js";
import { generateLoopRoute } from "../services/roads/loopRoute.service.js";
import { generateTomTomLoopRoute } from "../services/roads/tomtomRouting.service.js";

const router = express.Router();
const VALID_MODES = new Set(["walking", "running", "cycling"]);

router.get("/segments", async (req, res) => {
  try {
    const areaKey = req.query.areaKey || "kp3";
    const mode = VALID_MODES.has(req.query.mode) ? req.query.mode : "walking";
    const segments = await listRoadSegments({ areaKey });

    if (req.query.format === "geojson") {
      return res
        .status(200)
        .json(roadSegmentsToFeatureCollection(segments, { mode }));
    }

    return res.status(200).json({
      success: true,
      count: segments.length,
      mode,
      data: segments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/loop", async (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const distanceKm = req.query.distanceKm;
  const mode = VALID_MODES.has(req.query.mode) ? req.query.mode : "walking";
  const areaKey = req.query.areaKey || "kp3";
  const tolerance =
    req.query.tolerance === undefined ? 0.25 : Number(req.query.tolerance);

  // Validate inputs early
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const parsedDistKm = Number(distanceKm);

  if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    return res.status(400).json({ success: false, message: "lat must be a valid latitude" });
  }
  if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({ success: false, message: "lng must be a valid longitude" });
  }
  if (!Number.isFinite(parsedDistKm) || parsedDistKm < 0.5 || parsedDistKm > 50) {
    return res.status(400).json({ success: false, message: "distanceKm must be between 0.5 and 50" });
  }

  // --- PRIMARY: TomTom routed loop (real road-snapped coordinates) ---
  const apiKey = process.env.TOMTOM_API_KEY;
  if (apiKey) {
    try {
      const tomtomResult = await generateTomTomLoopRoute({
        startPoint: { lat: parsedLat, lng: parsedLng },
        distanceKm: parsedDistKm,
        mode,
        apiKey,
      });

      if (tomtomResult.coordinates.length >= 3) {
        const routeFeature = {
          type: "Feature",
          properties: {
            areaKey,
            mode,
            requestedDistanceKm: parsedDistKm,
            distanceMeters: tomtomResult.distanceMeters,
            distanceKm: Number((tomtomResult.distanceMeters / 1000).toFixed(2)),
            travelTimeSeconds: tomtomResult.travelTimeSeconds,
            safetyScore: 0.75,    // Default; can be enriched later
            segmentCount: tomtomResult.coordinates.length,
            source: "tomtom_routing",
          },
          geometry: {
            type: "LineString",
            coordinates: tomtomResult.coordinates,
          },
        };

        return res.status(200).json({
          success: true,
          data: routeFeature,
        });
      }
    } catch (tomtomErr) {
      console.warn("TomTom routing failed, falling back to OSM graph:", tomtomErr.message);
    }
  }

  // --- FALLBACK: OSM graph-based loop ---
  try {
    const route = await generateLoopRoute({
      lat,
      lng,
      distanceKm,
      mode,
      areaKey,
      tolerance,
    });

    return res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    const statusCode =
      error.message.includes("must") ||
      error.message.includes("Could not") ||
      error.message.includes("No road")
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/segments/:segmentId/traffic", protect, async (req, res) => {
  try {
    const segment = await updateRoadSegmentTraffic({
      segmentId: req.params.segmentId,
      currentLevel: Number(req.body.currentLevel),
      source: req.body.source || "manual",
      confidence:
        req.body.confidence === undefined ? 0.7 : Number(req.body.confidence),
      currentSpeedKph:
        req.body.currentSpeedKph === undefined
          ? null
          : Number(req.body.currentSpeedKph),
      freeFlowSpeedKph:
        req.body.freeFlowSpeedKph === undefined
          ? null
          : Number(req.body.freeFlowSpeedKph),
      roadClosure: Boolean(req.body.roadClosure),
    });

    return res.status(200).json({
      success: true,
      data: segment,
    });
  } catch (error) {
    const statusCode =
      error.message.includes("not found")
        ? 404
        : error.message.includes("required") ||
            error.message.includes("between")
          ? 400
          : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
