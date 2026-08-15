/**
 * Final Endpoint Test Script
 * Runs all 9 steps counter API endpoints and prints real request/response payloads.
 */

import connectDB from "../src/config/dataBase.js";
import app from "../src/app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../src/config/config.js";
import { User } from "../src/models/user.model.js";
import { DailyActivity } from "../src/models/dailyActivity.model.js";

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

async function runEndpointTests() {
  await connectDB();
  const server = app.listen(PORT);

  try {
    // Clean and setup user
    await User.deleteMany({ email: "reportuser@rovr.test" });
    await DailyActivity.deleteMany({});

    const user = await User.create({
      name: "Report Tester",
      email: "reportuser@rovr.test",
      password: "hashedpassword",
      height: 175,
      weight: 70,
      gender: "Male",
      daily_step_goal: 10000,
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      config.JWT_SECRET
    );

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    console.log("\n========================================================");
    console.log("📡 TESTING ALL STEPS COUNTER API ENDPOINTS");
    console.log("========================================================\n");

    // 1. POST /sync (Day 1)
    console.log("1️⃣  POST /api/services/steps/sync (Sync Day 1)");
    let res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: "2026-08-13",
        steps: 10500,
        active_minutes: 85,
      }),
    });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // Sync Day 2
    await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: "2026-08-14",
        steps: 7842,
        active_minutes: 74,
      }),
    });

    // 2. GET /today
    console.log("2️⃣  GET /api/services/steps/today?date=2026-08-14");
    res = await fetch(`${BASE_URL}/api/services/steps/today?date=2026-08-14`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 3. GET /history
    console.log("3️⃣  GET /api/services/steps/history?start_date=2026-08-01&end_date=2026-08-14");
    res = await fetch(`${BASE_URL}/api/services/steps/history?start_date=2026-08-01&end_date=2026-08-14`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 4. GET /weekly
    console.log("4️⃣  GET /api/services/steps/weekly");
    res = await fetch(`${BASE_URL}/api/services/steps/weekly`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 5. GET /monthly
    console.log("5️⃣  GET /api/services/steps/monthly");
    res = await fetch(`${BASE_URL}/api/services/steps/monthly`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 6. GET /stats
    console.log("6️⃣  GET /api/services/steps/stats");
    res = await fetch(`${BASE_URL}/api/services/steps/stats`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 7. GET /streak
    console.log("7️⃣  GET /api/services/steps/streak");
    res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 8. GET /goal
    console.log("8️⃣  GET /api/services/steps/goal");
    res = await fetch(`${BASE_URL}/api/services/steps/goal`, { headers });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // 9. PUT /goal
    console.log("9️⃣  PUT /api/services/steps/goal (Update Goal to 12,000)");
    res = await fetch(`${BASE_URL}/api/services/steps/goal`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ goal: 12000 }),
    });
    console.log(`Status: ${res.status}`);
    console.log("Response:", JSON.stringify(await res.json(), null, 2), "\n");

    // Clean up
    await User.deleteMany({ email: "reportuser@rovr.test" });
    await DailyActivity.deleteMany({});
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runEndpointTests();
