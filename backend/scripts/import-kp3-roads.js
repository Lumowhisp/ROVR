import mongoose from "mongoose";
import connectDB from "../src/config/dataBase.js";
import { importRoadSegments, KP3_BBOX } from "../src/services/roads/osmRoadImport.service.js";

function readBooleanEnv(name, fallback) {
  if (process.env[name] === undefined) {
    return fallback;
  }

  return ["1", "true", "yes"].includes(process.env[name].toLowerCase());
}

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

  const result = await importRoadSegments({
    areaKey: process.env.ROAD_AREA_KEY || "kp3",
    bbox: readBBoxFromEnv(),
    overpassUrl: process.env.OVERPASS_URL,
    replaceExisting: readBooleanEnv("REPLACE_EXISTING_ROADS", true),
  });

  console.log(
    `Imported ${result.segments} road segments from ${result.ways} OSM ways for ${result.areaKey}`
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
