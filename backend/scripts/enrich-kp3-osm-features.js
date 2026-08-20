import mongoose from "mongoose";
import connectDB from "../src/config/dataBase.js";
import { KP3_BBOX } from "../src/services/roads/osmRoadImport.service.js";
import { enrichRoadSegmentsWithOsmFeatures } from "../src/services/roads/osmFeatureEnrichment.service.js";

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
  await connectDB();

  const result = await enrichRoadSegmentsWithOsmFeatures({
    areaKey: process.env.ROAD_AREA_KEY || "kp3",
    bbox: readBBoxFromEnv(),
    radiusMeters: Number(process.env.OSM_FEATURE_RADIUS_METERS || 200),
  });

  console.log(
    `Enriched ${result.segments} road segments using ${result.features} OSM features for ${result.areaKey}`
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
