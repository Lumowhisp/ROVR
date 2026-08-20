import mongoose from "mongoose";
import connectDB from "../src/config/dataBase.js";
import { RoadSegment } from "../src/models/roadSegment.model.js";
import { KP3_BBOX } from "../src/services/roads/osmRoadImport.service.js";
import { calculateModeScores } from "../src/services/roads/safetyScoring.service.js";
import {
  calculateIncidentRiskForSegment,
  fetchTomTomIncidentsForBbox,
} from "../src/services/roads/tomtomTraffic.service.js";

function readBBoxFromEnv() {
  if (!process.env.KP3_BBOX) {
    return KP3_BBOX;
  }

  const [south, west, north, east] = process.env.KP3_BBOX.split(",").map(Number);
  if ([south, west, north, east].some((value) => !Number.isFinite(value))) {
    throw new Error("KP3_BBOX must be: south,west,north,east");
  }

  return { south, west, north, east };
}

async function main() {
  if (!process.env.TOMTOM_API_KEY) {
    throw new Error("TOMTOM_API_KEY not found in env");
  }

  await connectDB();

  const areaKey = process.env.ROAD_AREA_KEY || "kp3";
  const incidents = await fetchTomTomIncidentsForBbox({
    bbox: readBBoxFromEnv(),
    apiKey: process.env.TOMTOM_API_KEY,
  });
  const segments = await RoadSegment.find({ areaKey });

  let updated = 0;
  for (const segment of segments) {
    const risk = calculateIncidentRiskForSegment(segment, incidents, {
      radiusMeters: Number(process.env.INCIDENT_RADIUS_METERS || 200),
    });
    segment.incidentRisk = risk.incidentRisk;
    segment.incidentCountNearby = risk.incidentCountNearby;
    segment.nearestIncidentDistance = risk.nearestIncidentDistance;
    segment.modeScores = calculateModeScores(segment);
    segment.safetyScore = segment.modeScores.walking;
    await segment.save();
    updated += 1;
  }

  console.log(
    `Updated incident risk for ${updated} ${areaKey} segments using ${incidents.length} TomTom incidents`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
