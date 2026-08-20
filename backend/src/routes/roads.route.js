import express from "express";
import { protect } from "../Middleware/protect.js";
import {
  listRoadSegments,
  roadSegmentsToFeatureCollection,
  updateRoadSegmentTraffic,
} from "../services/roads/osmRoadImport.service.js";
import { generateLoopRoute } from "../services/roads/loopRoute.service.js";

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
  try {
    const route = await generateLoopRoute({
      lat: req.query.lat,
      lng: req.query.lng,
      distanceKm: req.query.distanceKm,
      mode: VALID_MODES.has(req.query.mode) ? req.query.mode : "walking",
      areaKey: req.query.areaKey || "kp3",
      tolerance:
        req.query.tolerance === undefined ? 0.25 : Number(req.query.tolerance),
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
