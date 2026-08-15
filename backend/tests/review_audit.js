/**
 * Comprehensive 10-Point Second-Level Production Review & Audit Script
 *
 * Runs end-to-end verification against live MongoDB instance and Express API server.
 */

import connectDB from "../src/config/dataBase.js";
import app from "../src/app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../src/config/config.js";
import { User } from "../src/models/user.model.js";
import { DailyActivity } from "../src/models/dailyActivity.model.js";
import {
  estimateStrideLength,
  calculateDistance,
  calculateCalories,
  calculatePace,
  calculateGoalProgress,
  calculateCurrentStreak,
  calculateLongestStreak,
} from "../src/utils/steps_calculator.js";

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function runAudit() {
  console.log("==========================================================");
  console.log("🚀 STARTING ROVR STEPS COUNTER PRODUCTION AUDIT");
  console.log("==========================================================\n");

  // Connect to DB and start HTTP server
  await connectDB();
  const server = app.listen(PORT);
  console.log(`✅ Server listening on ${BASE_URL}\n`);

  const results = {
    data_consistency: false,
    duplicate_protection: false,
    calculation_correctness: false,
    analytics_correctness: false,
    authorization: false,
    input_abuse: false,
    existing_safety: false,
    api_verification: false,
    database_verification: false,
  };

  try {
    // Clean test collections before audit
    await User.deleteMany({ email: { $regex: /@audit\.test$/ } });
    await DailyActivity.deleteMany({});

    // ──────────────────────────────────────────────────────────
    // SETUP TEST USERS
    // ──────────────────────────────────────────────────────────
    const userA = await User.create({
      name: "Audit User A",
      email: "usera@audit.test",
      password: "hashedpassword123",
      height: 180,
      weight: 80,
      gender: "Male",
      daily_step_goal: 10000,
    });

    const userB = await User.create({
      name: "Audit User B",
      email: "userb@audit.test",
      password: "hashedpassword123",
      height: 165,
      weight: 60,
      gender: "Female",
      daily_step_goal: 8000,
    });

    const tokenA = jwt.sign(
      { id: userA._id.toString(), email: userA.email },
      config.JWT_SECRET
    );
    const tokenB = jwt.sign(
      { id: userB._id.toString(), email: userB.email },
      config.JWT_SECRET
    );

    const headersA = {
      Authorization: `Bearer ${tokenA}`,
      "Content-Type": "application/json",
    };
    const headersB = {
      Authorization: `Bearer ${tokenB}`,
      "Content-Type": "application/json",
    };

    // ──────────────────────────────────────────────────────────
    // 1. DATA CONSISTENCY TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 1. Testing Data Consistency & Sync Behavior ---");

    // Sync 5000 steps (cumulative)
    let sync1Res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        date: "2026-08-10",
        steps: 5000,
        active_minutes: 40,
      }),
    });
    let sync1Data = await sync1Res.json();
    console.log("  Sync 1 (5000 steps):", sync1Data.data.steps);

    // Sync same day again with 5000 steps (cumulative) -> should remain 5000 (idempotent)
    let sync2Res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        date: "2026-08-10",
        steps: 5000,
        active_minutes: 40,
      }),
    });
    let sync2Data = await sync2Res.json();
    console.log("  Sync 2 (same 5000 steps cumulative):", sync2Data.data.steps);

    // Sync same day with 7000 steps (cumulative update)
    let sync3Res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        date: "2026-08-10",
        steps: 7000,
        active_minutes: 50,
      }),
    });
    let sync3Data = await sync3Res.json();
    console.log("  Sync 3 (updated to 7000 steps):", sync3Data.data.steps);

    // Sync same day with 1000 steps incremental
    let sync4Res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        date: "2026-08-10",
        steps: 1000,
        active_minutes: 10,
        sync_mode: "incremental",
      }),
    });
    let sync4Data = await sync4Res.json();
    console.log("  Sync 4 (incremental +1000 steps):", sync4Data.data.steps);

    // Date/Timezone test
    let todayRes = await fetch(
      `${BASE_URL}/api/services/steps/today?date=2026-08-10`,
      { headers: headersA }
    );
    let todayData = await todayRes.json();

    if (
      sync1Data.data.steps === 5000 &&
      sync2Data.data.steps === 5000 &&
      sync3Data.data.steps === 7000 &&
      sync4Data.data.steps === 8000 &&
      todayData.data.steps === 8000
    ) {
      console.log("  ✅ Data consistency & sync modes PASS\n");
      results.data_consistency = true;
    } else {
      console.log("  ❌ Data consistency FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 2. DUPLICATE PROTECTION TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 2. Testing Database Duplicate Protection ---");
    const countBefore = await DailyActivity.countDocuments({
      user: userA._id,
      date: "2026-08-10",
    });

    let duplicateErrorCaught = false;
    try {
      // Direct raw Mongoose insert attempting duplicate user+date
      await DailyActivity.create([
        { user: userA._id, date: "2026-08-10", steps: 3000 },
      ]);
    } catch (err) {
      if (err.code === 11000) {
        duplicateErrorCaught = true;
      }
    }

    const countAfter = await DailyActivity.countDocuments({
      user: userA._id,
      date: "2026-08-10",
    });

    if (countBefore === 1 && countAfter === 1 && duplicateErrorCaught) {
      console.log(
        "  ✅ Duplicate key index restriction enforced (code 11000) PASS\n"
      );
      results.duplicate_protection = true;
    } else {
      console.log("  ❌ Duplicate protection FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 3. CALCULATION CORRECTNESS TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 3. Verifying Formulas & Calculations ---");
    // User A: Height 180cm, Weight 80kg, Gender Male
    // Formula check:
    // Stride = 180 * 0.415 = 74.7 cm
    // Steps = 10,000 -> Distance = (10000 * 74.7) / 100000 = 7.47 km
    // Active minutes = 60
    // Calories = (80 * 7.47 * 0.57) + (60 * 80 * 0.035) = 340.632 + 168 = 508.632 -> 509 kcal
    // Pace = 60 / 7.47 = 8.03 -> 8.0 min/km
    // Goal progress = min((10000/10000)*100, 100) = 100%

    const strideCalc = estimateStrideLength(180, "Male");
    const distCalc = calculateDistance(10000, strideCalc);
    const calCalc = calculateCalories(80, distCalc, 60);
    const paceCalc = calculatePace(60, distCalc);
    const goalCalc = calculateGoalProgress(10000, 10000);

    console.log(`  Expected Stride: 74.7 cm | Calculated: ${strideCalc} cm`);
    console.log(`  Expected Distance: 7.47 km | Calculated: ${distCalc} km`);
    console.log(`  Expected Calories: 509 kcal | Calculated: ${calCalc} kcal`);
    console.log(`  Expected Pace: 8.0 min/km | Calculated: ${paceCalc} min/km`);
    console.log(
      `  Expected Goal Progress: 100% | Calculated: ${goalCalc.progress}% (completed: ${goalCalc.completed})`
    );

    // Division by zero checks
    const zeroPace = calculatePace(0, 0);
    const zeroDist = calculateDistance(0, 0);
    const missingProfileStride = estimateStrideLength(null, null);

    if (
      strideCalc === 74.7 &&
      distCalc === 7.47 &&
      calCalc === 509 &&
      paceCalc === 8.0 &&
      goalCalc.progress === 100 &&
      zeroPace === 0 &&
      zeroDist === 0 &&
      missingProfileStride === 75
    ) {
      console.log("  ✅ Calculation correctness & edge cases PASS\n");
      results.calculation_correctness = true;
    } else {
      console.log("  ❌ Calculation correctness FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 4. ANALYTICS CORRECTNESS TEST (Controlled Dataset)
    // ──────────────────────────────────────────────────────────
    console.log("--- 4. Testing Analytics with Controlled Dataset ---");
    // Clean daily activity for User A
    await DailyActivity.deleteMany({ user: userA._id });

    // Dataset specified in prompt:
    // Day 1 (2026-08-01): 5,000 steps (active_min: 40) -> Goal 10,000 (not completed)
    // Day 2 (2026-08-02): 10,000 steps (active_min: 75) -> Goal 10,000 (completed)
    // Day 3 (2026-08-03): 8,000 steps (active_min: 60) -> Goal 10,000 (not completed)
    // Day 4 (2026-08-04): 10,000 steps (active_min: 80) -> Goal 10,000 (completed)

    await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ date: "2026-08-01", steps: 5000, active_minutes: 40 }),
    });
    await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ date: "2026-08-02", steps: 10000, active_minutes: 75 }),
    });
    await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ date: "2026-08-03", steps: 8000, active_minutes: 60 }),
    });
    await fetch(`${BASE_URL}/api/services/steps/sync`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ date: "2026-08-04", steps: 10000, active_minutes: 80 }),
    });

    const historyRes = await fetch(`${BASE_URL}/api/services/steps/history`, {
      headers: headersA,
    });
    const historyData = await historyRes.json();

    const statsRes = await fetch(`${BASE_URL}/api/services/steps/stats`, {
      headers: headersA,
    });
    const statsData = await statsRes.json();

    const streakRes = await fetch(`${BASE_URL}/api/services/steps/streak`, {
      headers: headersA,
    });
    const streakData = await streakRes.json();

    console.log("  Controlled Dataset Results:");
    console.log("    Total Steps:", statsData.data.avg_steps * 4); // 33000 total / 4 days = 8250 avg
    console.log("    Average Steps/Day:", statsData.data.avg_steps);
    console.log("    Highest Steps in a Day:", statsData.data.highest_steps_in_a_day);
    console.log("    Longest Streak:", streakData.data.longest_streak);

    const isTotalCorrect = statsData.data.avg_steps === 8250;
    const isHighestCorrect = statsData.data.highest_steps_in_a_day.steps === 10000;
    const isLongestStreakCorrect = streakData.data.longest_streak === 1; // non-consecutive completions

    if (isTotalCorrect && isHighestCorrect && isLongestStreakCorrect) {
      console.log("  ✅ Analytics & Controlled dataset verification PASS\n");
      results.analytics_correctness = true;
    } else {
      console.log("  ❌ Analytics verification FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 5. AUTHORIZATION & USER ISOLATION TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 5. Testing Authorization & User Isolation ---");

    // User B fetches history -> should be 0 records (User A has 4 records)
    const historyBRes = await fetch(`${BASE_URL}/api/services/steps/history`, {
      headers: headersB,
    });
    const historyBData = await historyBRes.json();

    // User B attempts to pass user_id of User A in query parameter
    const exploitRes = await fetch(
      `${BASE_URL}/api/services/steps/history?user_id=${userA._id}`,
      { headers: headersB }
    );
    const exploitData = await exploitRes.json();

    console.log("  User B history records count:", historyBData.data.length);
    console.log("  User B query with User A user_id count:", exploitData.data.length);

    if (historyBData.data.length === 0 && exploitData.data.length === 0) {
      console.log("  ✅ Strict user isolation via JWT token PASS\n");
      results.authorization = true;
    } else {
      console.log("  ❌ Authorization FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 6. INPUT ABUSE TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 6. Testing Input Abuse & Validations ---");

    const abuseCases = [
      { name: "Negative steps", body: { date: "2026-08-10", steps: -1 }, expected: 400 },
      { name: "Null steps", body: { date: "2026-08-10", steps: null }, expected: 400 },
      { name: "String steps", body: { date: "2026-08-10", steps: "hello" }, expected: 400 },
      { name: "Extremely large steps", body: { date: "2026-08-10", steps: 9999999 }, expected: 400 },
      { name: "Negative active minutes", body: { date: "2026-08-10", steps: 100, active_minutes: -5 }, expected: 400 },
      { name: "Invalid date format", body: { date: "invalid-date", steps: 100 }, expected: 400 },
      { name: "Future date", body: { date: "2099-01-01", steps: 100 }, expected: 400 },
    ];

    let abusePassed = true;
    for (const testCase of abuseCases) {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersA,
        body: JSON.stringify(testCase.body),
      });
      if (res.status !== testCase.expected) {
        console.log(`  ❌ Case '${testCase.name}' failed. Expected ${testCase.expected}, got ${res.status}`);
        abusePassed = false;
      }
    }

    // Goal input abuse (PUT /goal)
    const badGoalRes = await fetch(`${BASE_URL}/api/services/steps/goal`, {
      method: "PUT",
      headers: headersA,
      body: JSON.stringify({ goal: -500 }),
    });
    if (badGoalRes.status !== 400) {
      console.log(`  ❌ Bad goal failed. Expected 400, got ${badGoalRes.status}`);
      abusePassed = false;
    }

    // Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/api/services/steps/today`);
    if (unauthRes.status !== 401) {
      console.log(`  ❌ Unauthenticated failed. Expected 401, got ${unauthRes.status}`);
      abusePassed = false;
    }

    if (abusePassed) {
      console.log("  ✅ Input abuse & error status codes PASS\n");
      results.input_abuse = true;
    } else {
      console.log("  ❌ Input abuse FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 7. EXISTING APPLICATION SAFETY TEST
    // ──────────────────────────────────────────────────────────
    console.log("--- 7. Testing Existing ROVR Application Safety ---");

    // Test signup
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Existing Test User",
        email: "existing@audit.test",
        password: "password123",
      }),
    });
    const signupData = await signupRes.json();

    // Test signin
    const signinRes = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "existing@audit.test",
        password: "password123",
      }),
    });
    const signinData = await signinRes.json();

    // Test onboard
    const onboardRes = await fetch(`${BASE_URL}/api/onboard`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signinData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weight: 75,
        height: 178,
        gender: "Male",
      }),
    });
    const onboardData = await onboardRes.json();

    // Test getBMI
    const bmiRes = await fetch(`${BASE_URL}/api/services/profile/getBMI`, {
      headers: { Authorization: `Bearer ${signinData.token}` },
    });
    const bmiData = await bmiRes.json();

    if (
      signupRes.status === 201 &&
      signinRes.status === 200 &&
      onboardRes.status === 200 &&
      bmiRes.status === 200 &&
      bmiData.bmi > 0
    ) {
      console.log("  ✅ Existing ROVR auth, onboard, profile endpoints PASS\n");
      results.existing_safety = true;
    } else {
      console.log("  ❌ Existing application safety FAIL\n");
    }

    // ──────────────────────────────────────────────────────────
    // 8. API VERIFICATION (Testing all 9 endpoints)
    // ──────────────────────────────────────────────────────────
    console.log("--- 8. Testing All 9 Steps Endpoints ---");

    const endpoints = [
      { name: "POST /steps/sync", url: "/api/services/steps/sync", method: "POST", body: { date: "2026-08-14", steps: 8000 } },
      { name: "GET /steps/today", url: "/api/services/steps/today", method: "GET" },
      { name: "GET /steps/history", url: "/api/services/steps/history?start_date=2026-08-01&end_date=2026-08-14", method: "GET" },
      { name: "GET /steps/weekly", url: "/api/services/steps/weekly", method: "GET" },
      { name: "GET /steps/monthly", url: "/api/services/steps/monthly", method: "GET" },
      { name: "GET /steps/stats", url: "/api/services/steps/stats", method: "GET" },
      { name: "GET /steps/streak", url: "/api/services/steps/streak", method: "GET" },
      { name: "GET /steps/goal", url: "/api/services/steps/goal", method: "GET" },
      { name: "PUT /steps/goal", url: "/api/services/steps/goal", method: "PUT", body: { goal: 12000 } },
    ];

    let apiPassedCount = 0;
    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: ep.method,
        headers: headersA,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✅ ${ep.name} -> ${res.status}`);
        apiPassedCount++;
      } else {
        console.log(`  ❌ ${ep.name} -> ${res.status}`);
      }
    }

    if (apiPassedCount === 9) {
      console.log("  ✅ All 9 Steps endpoints verified PASS\n");
      results.api_verification = true;
    } else {
      console.log(`  ❌ Endpoints passed: ${apiPassedCount}/9\n`);
    }

    // ──────────────────────────────────────────────────────────
    // 9. DATABASE VERIFICATION
    // ──────────────────────────────────────────────────────────
    console.log("--- 9. Database Model & Index Verification ---");

    const indexes = await DailyActivity.collection.indexes();
    const hasUniqueIndex = indexes.some(
      (idx) => idx.key.user === 1 && idx.key.date === 1 && idx.unique === true
    );

    const docCount = await DailyActivity.countDocuments({ user: userA._id });
    const sampleDoc = await DailyActivity.findOne({ user: userA._id });

    console.log("  Unique (user, date) index exists:", hasUniqueIndex);
    console.log("  Total documents created for User A:", docCount);
    console.log("  Sample document has createdAt & updatedAt:", !!sampleDoc?.createdAt);

    if (hasUniqueIndex && docCount > 0 && sampleDoc?.createdAt) {
      console.log("  ✅ Database indexes, timestamps & records PASS\n");
      results.database_verification = true;
    } else {
      console.log("  ❌ Database verification FAIL\n");
    }

    // Cleanup test users
    await User.deleteMany({ email: { $regex: /@audit\.test$/ } });
    await DailyActivity.deleteMany({});

  } catch (error) {
    console.error("❌ AUDIT UNEXPECTED ERROR:", error);
  } finally {
    server.close();
    await mongoose.connection.close();
  }

  console.log("==========================================================");
  console.log("📊 FINAL VERIFICATION AUDIT SUMMARY");
  console.log("==========================================================");
  console.table(results);
}

runAudit();
