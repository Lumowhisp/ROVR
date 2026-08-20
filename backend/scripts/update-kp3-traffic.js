import mongoose from "mongoose";
import connectDB from "../src/config/dataBase.js";
import { RoadSegment } from "../src/models/roadSegment.model.js";
import { calculateModeScores } from "../src/services/roads/safetyScoring.service.js";
import { fetchTomTomTrafficForSegment } from "../src/services/roads/tomtomTraffic.service.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.TOMTOM_API_KEY) {
    throw new Error("TOMTOM_API_KEY not found in env");
  }

  await connectDB();

  const areaKey = process.env.ROAD_AREA_KEY || "kp3";
  const limit = Number(process.env.TRAFFIC_UPDATE_LIMIT || 50);
  const delayMs = Number(process.env.TRAFFIC_UPDATE_DELAY_MS || 250);
  const segments = await RoadSegment.find({ areaKey }).sort({ segmentId: 1 }).limit(limit);

  let updated = 0;
  for (const segment of segments) {
    const traffic = await fetchTomTomTrafficForSegment(segment, {
      apiKey: process.env.TOMTOM_API_KEY,
    });

    if (traffic.currentLevel !== null) {
      segment.traffic = {
        ...segment.traffic?.toObject?.(),
        ...traffic,
        updatedAt: new Date(),
      };
      segment.modeScores = calculateModeScores(segment);
      segment.safetyScore = segment.modeScores.walking;
      await segment.save();
      updated += 1;
    }

    await sleep(delayMs);
  }

  console.log(`Updated TomTom traffic for ${updated}/${segments.length} ${areaKey} segments`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
