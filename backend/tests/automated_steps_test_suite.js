/**
 * Automated Steps API Test Suite
 * ROVR Backend — Comprehensive Steps Counter API Test Suite
 */

import connectDB from "../src/config/dataBase.js";
import app from "../src/app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../src/config/config.js";
import { User } from "../src/models/user.model.js";
import { DailyActivity } from "../src/models/dailyActivity.model.js";

const PORT = 3010;
const BASE_URL = `http://localhost:${PORT}`;

// Test result storage
const testResults = [];

function recordResult({ category, id, name, passed, expected, actual, reason, endpoint, fileResponsible }) {
  const resultObj = {
    category,
    id,
    name,
    passed: !!passed,
    expected,
    actual,
    reason: reason || (passed ? "Match expected behavior" : "Assertion mismatch"),
    endpoint: endpoint || "N/A",
    fileResponsible: fileResponsible || "N/A",
  };
  testResults.push(resultObj);

  if (passed) {
    console.log(`[PASS] ${id} - ${name}`);
  } else {
    console.log(`[FAIL] ${id} - ${name}`);
    console.log(`       Expected: ${JSON.stringify(expected)}`);
    console.log(`       Actual:   ${JSON.stringify(actual)}`);
    console.log(`       Reason:   ${resultObj.reason}`);
  }
}

// Date Helpers
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getDaysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function getDaysAheadStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function isValidCalendarDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() === m - 1 &&
    dateObj.getUTCDate() === d
  );
}

// Helper to signup & get token
async function createTestUser(namePrefix) {
  const timestamp = Date.now() + "_" + Math.floor(Math.random() * 10000);
  const email = `${namePrefix}_${timestamp}@rovr.test`;
  const password = "Password123!";

  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `${namePrefix} User`, email, password }),
  });

  const data = await res.json();
  if (res.status !== 201 || !data.token) {
    throw new Error(`Failed to create test user ${email}: ${data.message || res.status}`);
  }

  return { email, token: data.token, user: data.user };
}

// Main Test Runner
async function runTestSuite() {
  console.log("==================================================");
  console.log("🚀 STARTING AUTOMATED STEPS API TEST SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("==================================================\n");

  await connectDB();
  const server = app.listen(PORT);

  try {
    // ----------------------------------------------------
    // CATEGORY A: AUTHENTICATION
    // ----------------------------------------------------
    console.log("\n--- CATEGORY A: AUTHENTICATION ---");
    const userAuth = await createTestUser("auth");
    const headersAuth = {
      Authorization: `Bearer ${userAuth.token}`,
      "Content-Type": "application/json",
    };

    // A1. Valid JWT
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, { headers: headersAuth });
      const data = await res.json();
      recordResult({
        category: "AUTH",
        id: "TC-AUTH-001",
        name: "Valid JWT token allows access",
        passed: res.status === 200 && data.success === true,
        expected: "HTTP 200 with success: true",
        actual: `HTTP ${res.status}, success: ${data.success}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/Middleware/protect.js",
      });
    }

    // A2. Missing Authorization header
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`);
      const data = await res.json();
      recordResult({
        category: "AUTH",
        id: "TC-AUTH-002",
        name: "Missing Authorization header rejected",
        passed: res.status === 401,
        expected: "HTTP 401 Unauthorized",
        actual: `HTTP ${res.status}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/Middleware/protect.js",
      });
    }

    // A3. Invalid JWT
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, {
        headers: { Authorization: "Bearer invalid_token_xyz_123" },
      });
      recordResult({
        category: "AUTH",
        id: "TC-AUTH-003",
        name: "Invalid JWT token rejected",
        passed: res.status === 401,
        expected: "HTTP 401 Unauthorized",
        actual: `HTTP ${res.status}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/Middleware/protect.js",
      });
    }

    // A4. Malformed Bearer token
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, {
        headers: { Authorization: "MalformedBearerTokenString" },
      });
      recordResult({
        category: "AUTH",
        id: "TC-AUTH-004",
        name: "Malformed Bearer token rejected",
        passed: res.status === 401,
        expected: "HTTP 401 Unauthorized",
        actual: `HTTP ${res.status}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/Middleware/protect.js",
      });
    }

    // ----------------------------------------------------
    // CATEGORY B: FRESH USER / EMPTY STATE
    // ----------------------------------------------------
    console.log("\n--- CATEGORY B: FRESH USER / EMPTY STATE ---");
    const freshUser = await createTestUser("fresh");
    const headersFresh = {
      Authorization: `Bearer ${freshUser.token}`,
      "Content-Type": "application/json",
    };

    // B1. today (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data && data.data.steps === 0 && data.data.goal === 10000;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-001",
        name: "GET /today for fresh user returns zero values",
        passed: p,
        expected: "HTTP 200, steps: 0, goal: 10000, goal_completed: false",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}, goal: ${data.data?.goal}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/services/steps/step.service.js (getToday)",
      });
    }

    // B2. history (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/history`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.count === 0 && Array.isArray(data.data) && data.data.length === 0;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-002",
        name: "GET /history for fresh user returns empty list",
        passed: p,
        expected: "HTTP 200, count: 0, data: []",
        actual: `HTTP ${res.status}, count: ${data.count}, data length: ${data.data?.length}`,
        endpoint: "GET /api/services/steps/history",
        fileResponsible: "src/services/steps/step.service.js (getHistory)",
      });
    }

    // B3. weekly (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/weekly`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data?.total_steps === 0 && data.data?.best_day === null;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-003",
        name: "GET /weekly for fresh user returns zero stats",
        passed: p,
        expected: "HTTP 200, total_steps: 0, best_day: null",
        actual: `HTTP ${res.status}, total_steps: ${data.data?.total_steps}, best_day: ${data.data?.best_day}`,
        endpoint: "GET /api/services/steps/weekly",
        fileResponsible: "src/services/steps/analytics.service.js (getWeeklyStats)",
      });
    }

    // B4. monthly (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/monthly`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data?.total_steps === 0 && data.data?.best_day === null;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-004",
        name: "GET /monthly for fresh user returns zero stats",
        passed: p,
        expected: "HTTP 200, total_steps: 0, best_day: null",
        actual: `HTTP ${res.status}, total_steps: ${data.data?.total_steps}, best_day: ${data.data?.best_day}`,
        endpoint: "GET /api/services/steps/monthly",
        fileResponsible: "src/services/steps/analytics.service.js (getMonthlyStats)",
      });
    }

    // B5. stats (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/stats`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data?.total_days_tracked === 0 && data.data?.highest_steps_in_a_day === null;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-005",
        name: "GET /stats for fresh user returns null personal bests",
        passed: p,
        expected: "HTTP 200, total_days_tracked: 0, highest_steps_in_a_day: null",
        actual: `HTTP ${res.status}, total_days_tracked: ${data.data?.total_days_tracked}, highest: ${JSON.stringify(data.data?.highest_steps_in_a_day)}`,
        endpoint: "GET /api/services/steps/stats",
        fileResponsible: "src/services/steps/analytics.service.js (getOverallStats)",
      });
    }

    // B6. streak (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data?.current_streak === 0 && data.data?.longest_streak === 0;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-006",
        name: "GET /streak for fresh user returns 0 streaks",
        passed: p,
        expected: "HTTP 200, current_streak: 0, longest_streak: 0",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}, longest_streak: ${data.data?.longest_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/services/steps/analytics.service.js (getStreaks)",
      });
    }

    // B7. goal (empty)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/goal`, { headers: headersFresh });
      const data = await res.json();
      const p = res.status === 200 && data.success && data.data?.goal === 10000;
      recordResult({
        category: "EMPTY STATE",
        id: "TC-EMPTY-007",
        name: "GET /goal for fresh user returns default goal (10000)",
        passed: p,
        expected: "HTTP 200, goal: 10000",
        actual: `HTTP ${res.status}, goal: ${data.data?.goal}`,
        endpoint: "GET /api/services/steps/goal",
        fileResponsible: "src/services/steps/goal.service.js (getGoal)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY C: VALID STEP SYNC
    // ----------------------------------------------------
    console.log("\n--- CATEGORY C: VALID STEP SYNC ---");
    const userSync = await createTestUser("sync_val");
    const headersSync = {
      Authorization: `Bearer ${userSync.token}`,
      "Content-Type": "application/json",
    };

    // C1. 0 steps
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(5), steps: 0 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-001",
        name: "Sync 0 steps",
        passed: res.status === 200 && data.data?.steps === 0,
        expected: "HTTP 200, steps: 0",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // C2. 1 step
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(4), steps: 1 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-002",
        name: "Sync 1 step",
        passed: res.status === 200 && data.data?.steps === 1,
        expected: "HTTP 200, steps: 1",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // C3. Normal step count
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(3), steps: 5000, active_minutes: 45 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-003",
        name: "Sync normal step count (5000)",
        passed: res.status === 200 && data.data?.steps === 5000,
        expected: "HTTP 200, steps: 5000",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // C4. Exactly 8000 steps
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(2), steps: 8000, active_minutes: 60 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-004",
        name: "Sync exactly 8000 steps",
        passed: res.status === 200 && data.data?.steps === 8000,
        expected: "HTTP 200, steps: 8000",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // C5. Above goal (12000)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(1), steps: 12000, active_minutes: 90 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-005",
        name: "Sync steps above goal (12000)",
        passed: res.status === 200 && data.data?.steps === 12000 && data.data?.goal_completed === true,
        expected: "HTTP 200, steps: 12000, goal_completed: true",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}, goal_completed: ${data.data?.goal_completed}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // C6. Large but reasonable value (250000)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSync,
        body: JSON.stringify({ date: getDaysAgoStr(6), steps: 250000, active_minutes: 300 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-SYNC-006",
        name: "Sync large but reasonable value (250,000)",
        passed: res.status === 200 && data.data?.steps === 250000,
        expected: "HTTP 200, steps: 250000",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY D: STEP VALIDATION
    // ----------------------------------------------------
    console.log("\n--- CATEGORY D: STEP VALIDATION ---");
    const userVal = await createTestUser("val");
    const headersVal = {
      Authorization: `Bearer ${userVal.token}`,
      "Content-Type": "application/json",
    };

    const stepValCases = [
      { id: "TC-VAL-001", name: "Negative steps (-100)", body: { date: getTodayStr(), steps: -100 } },
      { id: "TC-VAL-002", name: "Decimal steps (7500.5)", body: { date: getTodayStr(), steps: 7500.5 } },
      { id: "TC-VAL-003", name: "Missing steps field", body: { date: getTodayStr() } },
      { id: "TC-VAL-004", name: "Null steps value", body: { date: getTodayStr(), steps: null } },
      { id: "TC-VAL-005", name: "String steps value ('5000')", body: { date: getTodayStr(), steps: "5000" } },
      { id: "TC-VAL-006", name: "Empty string steps ('')", body: { date: getTodayStr(), steps: "" } },
      { id: "TC-VAL-007", name: "Excessively large steps (600,000)", body: { date: getTodayStr(), steps: 600000 } },
    ];

    for (const vc of stepValCases) {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersVal,
        body: JSON.stringify(vc.body),
      });
      const data = await res.json();
      recordResult({
        category: "VALIDATION",
        id: vc.id,
        name: vc.name,
        passed: res.status === 400 && data.success === false,
        expected: "HTTP 400 Bad Request, success: false",
        actual: `HTTP ${res.status}, success: ${data.success}, msg: "${data.message}"`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps step validation)",
      });
    }

    // D8. Invalid JSON
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersVal,
        body: "{ bad json string",
      });
      recordResult({
        category: "VALIDATION",
        id: "TC-VAL-008",
        name: "Invalid JSON body payload",
        passed: res.status === 400,
        expected: "HTTP 400 Bad Request",
        actual: `HTTP ${res.status}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "Express express.json() middleware / error handler",
      });
    }

    // ----------------------------------------------------
    // CATEGORY E: DATE VALIDATION
    // ----------------------------------------------------
    console.log("\n--- CATEGORY E: DATE VALIDATION ---");

    const dateValCases = [
      { id: "TC-DATE-001", name: "Today's date", date: getTodayStr(), expStatus: 200 },
      { id: "TC-DATE-002", name: "Yesterday's date", date: getYesterdayStr(), expStatus: 200 },
      { id: "TC-DATE-003", name: "Older valid date (2026-01-15)", date: "2026-01-15", expStatus: 200 },
      { id: "TC-DATE-004", name: "Future date (tomorrow)", date: getDaysAheadStr(1), expStatus: 400 },
      { id: "TC-DATE-005", name: "Far future date (2099-12-31)", date: "2099-12-31", expStatus: 400 },
      { id: "TC-DATE-006", name: "Invalid format (DD-MM-YYYY: 14-08-2026)", date: "14-08-2026", expStatus: 400 },
      { id: "TC-DATE-007", name: "Empty date string ('')", date: "", expStatus: 400 },
      { id: "TC-DATE-008", name: "Null date", date: null, expStatus: 400 },
      { id: "TC-DATE-009", name: "Invalid calendar date (2026-02-30)", date: "2026-02-30", expStatus: 400, isCalendarTest: true },
      { id: "TC-DATE-010", name: "Invalid non-leap date (2026-02-29)", date: "2026-02-29", expStatus: 400, isCalendarTest: true },
      { id: "TC-DATE-011", name: "Valid leap date (2024-02-29)", date: "2024-02-29", expStatus: 200, isCalendarTest: true },
    ];

    for (const dc of dateValCases) {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersVal,
        body: JSON.stringify({ date: dc.date, steps: 5000 }),
      });
      const data = await res.json();
      const passed = res.status === dc.expStatus;
      let reason = `Status code HTTP ${res.status} (expected ${dc.expStatus})`;
      if (dc.isCalendarTest && !isValidCalendarDate(dc.date) && res.status === 200) {
        reason = `Backend regex/Date parser accepted invalid calendar date '${dc.date}' without verifying actual calendar validity!`;
      }
      recordResult({
        category: "DATE",
        id: dc.id,
        name: dc.name,
        passed,
        expected: `HTTP ${dc.expStatus}`,
        actual: `HTTP ${res.status} (message: "${data.message || ''}")`,
        reason,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (validateDate)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY F: ACTIVE MINUTES
    // ----------------------------------------------------
    console.log("\n--- CATEGORY F: ACTIVE MINUTES ---");

    const actValCases = [
      { id: "TC-ACT-001", name: "Active minutes = 0", act: 0, expStatus: 200 },
      { id: "TC-ACT-002", name: "Normal active minutes = 60", act: 60, expStatus: 200 },
      { id: "TC-ACT-003", name: "Decimal active minutes = 45.5", act: 45.5, expStatus: 400, isIntegerTest: true },
      { id: "TC-ACT-004", name: "Negative active minutes = -10", act: -10, expStatus: 400 },
      { id: "TC-ACT-005", name: "Active minutes > 1440 (1500)", act: 1500, expStatus: 400 },
      { id: "TC-ACT-006", name: "Missing active_minutes field", act: undefined, expStatus: 200 },
      { id: "TC-ACT-007", name: "Null active_minutes value", act: null, expStatus: 200 },
      { id: "TC-ACT-008", name: "String active_minutes ('60')", act: "60", expStatus: 400 },
    ];

    for (const ac of actValCases) {
      const payload = { date: getDaysAgoStr(7), steps: 5000 };
      if (ac.act !== undefined) payload.active_minutes = ac.act;

      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersVal,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      let reason = `Status code HTTP ${res.status} (expected ${ac.expStatus})`;
      if (ac.isIntegerTest && res.status === 200) {
        reason = "Backend accepts decimal active_minutes (45.5) without requiring integer validation";
      }
      recordResult({
        category: "VALIDATION",
        id: ac.id,
        name: ac.name,
        passed: res.status === ac.expStatus,
        expected: `HTTP ${ac.expStatus}`,
        actual: `HTTP ${res.status} (${data.message || 'success'})`,
        reason,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps active_minutes validation)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY G: GOAL
    // ----------------------------------------------------
    console.log("\n--- CATEGORY G: GOAL ---");
    const userGoal = await createTestUser("goal");
    const headersGoal = {
      Authorization: `Bearer ${userGoal.token}`,
      "Content-Type": "application/json",
    };

    // G1. Get default goal
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/goal`, { headers: headersGoal });
      const data = await res.json();
      recordResult({
        category: "GOAL",
        id: "TC-GOAL-001",
        name: "Get default daily step goal (10,000)",
        passed: res.status === 200 && data.data?.goal === 10000,
        expected: "HTTP 200, goal: 10000",
        actual: `HTTP ${res.status}, goal: ${data.data?.goal}`,
        endpoint: "GET /api/services/steps/goal",
        fileResponsible: "src/services/steps/goal.service.js (getGoal)",
      });
    }

    // G2-G5. Update goal valid values
    const goalValidCases = [
      { id: "TC-GOAL-002", name: "Update goal to 12,000", goal: 12000 },
      { id: "TC-GOAL-003", name: "Update goal = 1", goal: 1 },
      { id: "TC-GOAL-004", name: "Update goal = 8,000", goal: 8000 },
      { id: "TC-GOAL-005", name: "Update goal = 200,000", goal: 200000 },
    ];

    for (const gc of goalValidCases) {
      const res = await fetch(`${BASE_URL}/api/services/steps/goal`, {
        method: "PUT",
        headers: headersGoal,
        body: JSON.stringify({ goal: gc.goal }),
      });
      const data = await res.json();
      recordResult({
        category: "GOAL",
        id: gc.id,
        name: gc.name,
        passed: res.status === 200 && data.data?.goal === gc.goal,
        expected: `HTTP 200, goal: ${gc.goal}`,
        actual: `HTTP ${res.status}, goal: ${data.data?.goal}`,
        endpoint: "PUT /api/services/steps/goal",
        fileResponsible: "src/services/steps/goal.service.js (updateGoal)",
      });
    }

    // G6-G12. Update goal invalid values
    const goalInvalidCases = [
      { id: "TC-GOAL-006", name: "Update goal = 0", goal: 0 },
      { id: "TC-GOAL-007", name: "Update goal = negative (-100)", goal: -100 },
      { id: "TC-GOAL-008", name: "Update goal = decimal (1000.5)", goal: 1000.5 },
      { id: "TC-GOAL-009", name: "Update goal = string ('10000')", goal: "10000" },
      { id: "TC-GOAL-010", name: "Update goal = null", goal: null },
      { id: "TC-GOAL-011", name: "Update goal = missing field ({})", goal: undefined },
      { id: "TC-GOAL-012", name: "Update goal > max allowed (200,001)", goal: 200001 },
    ];

    for (const gc of goalInvalidCases) {
      const body = gc.goal === undefined ? {} : { goal: gc.goal };
      const res = await fetch(`${BASE_URL}/api/services/steps/goal`, {
        method: "PUT",
        headers: headersGoal,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      recordResult({
        category: "GOAL",
        id: gc.id,
        name: gc.name,
        passed: res.status === 400 && data.success === false,
        expected: "HTTP 400 Bad Request, success: false",
        actual: `HTTP ${res.status}, message: "${data.message || ''}"`,
        endpoint: "PUT /api/services/steps/goal",
        fileResponsible: "src/services/steps/goal.service.js (updateGoal validation)",
      });
    }

    // G13. Verify goal_progress and goal_completed update correctly
    {
      // Reset goal to 8000
      await fetch(`${BASE_URL}/api/services/steps/goal`, {
        method: "PUT",
        headers: headersGoal,
        body: JSON.stringify({ goal: 8000 }),
      });

      // Sync 8000 steps today
      const todayStr = getTodayStr();
      await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersGoal,
        body: JSON.stringify({ date: todayStr, steps: 8000 }),
      });

      // GET /today
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, { headers: headersGoal });
      const data = await res.json();
      const p = res.status === 200 && data.data?.goal === 8000 && data.data?.goal_progress === 100 && data.data?.goal_completed === true;
      recordResult({
        category: "GOAL",
        id: "TC-GOAL-013",
        name: "Verify goal_progress and goal_completed update on goal change",
        passed: p,
        expected: "HTTP 200, goal: 8000, goal_progress: 100, goal_completed: true",
        actual: `HTTP ${res.status}, goal: ${data.data?.goal}, progress: ${data.data?.goal_progress}, completed: ${data.data?.goal_completed}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/services/steps/step.service.js (getToday)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY H: SYNC MODES
    // ----------------------------------------------------
    console.log("\n--- CATEGORY H: SYNC MODES ---");
    const userSyncMode = await createTestUser("syncmode");
    const headersSyncMode = {
      Authorization: `Bearer ${userSyncMode.token}`,
      "Content-Type": "application/json",
    };

    const targetDate = getDaysAgoStr(8);

    // H1. Initial sync (default mode)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSyncMode,
        body: JSON.stringify({ date: targetDate, steps: 5000, active_minutes: 30 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-MODE-001",
        name: "Initial sync (default mode)",
        passed: res.status === 200 && data.data?.steps === 5000,
        expected: "HTTP 200, stored steps: 5000",
        actual: `HTTP ${res.status}, stored steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // H2. Cumulative update (resync 7000 steps without mode or mode='cumulative')
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSyncMode,
        body: JSON.stringify({ date: targetDate, steps: 7000, active_minutes: 45, sync_mode: "cumulative" }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-MODE-002",
        name: "Cumulative update (replaces steps with 7000)",
        passed: res.status === 200 && data.data?.steps === 7000,
        expected: "HTTP 200, stored steps: 7000",
        actual: `HTTP ${res.status}, stored steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps)",
      });
    }

    // H3. Incremental update (add 3000 steps with sync_mode='incremental')
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSyncMode,
        body: JSON.stringify({ date: targetDate, steps: 3000, active_minutes: 15, sync_mode: "incremental" }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-MODE-003",
        name: "Incremental update (adds 3000 steps to 7000 = 10000)",
        passed: res.status === 200 && data.data?.steps === 10000 && data.data?.active_minutes === 60,
        expected: "HTTP 200, stored steps: 10000, active_minutes: 60",
        actual: `HTTP ${res.status}, stored steps: ${data.data?.steps}, active_minutes: ${data.data?.active_minutes}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps incremental logic)",
      });
    }

    // H4. Verify final stored values in DB
    {
      const doc = await DailyActivity.findOne({ user: userSyncMode.user._id, date: targetDate });
      recordResult({
        category: "SYNC",
        id: "TC-MODE-004",
        name: "Verify final stored values in database",
        passed: doc && doc.steps === 10000 && doc.active_minutes === 60,
        expected: "DB doc steps: 10000, active_minutes: 60",
        actual: doc ? `steps: ${doc.steps}, active_minutes: ${doc.active_minutes}` : "No DB doc found",
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js",
      });
    }

    // H5. Test invalid sync_mode value ('invalid_mode')
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSyncMode,
        body: JSON.stringify({ date: targetDate, steps: 5000, sync_mode: "invalid_mode" }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-MODE-005",
        name: "Reject invalid sync_mode value ('invalid_mode')",
        passed: res.status === 400,
        expected: "HTTP 400 Bad Request",
        actual: `HTTP ${res.status} (msg: "${data.message || ''}")`,
        reason: res.status === 200 ? "Backend silently accepts unrecognized sync_mode values and falls through to cumulative overwrite without validation" : "Rejected invalid sync_mode",
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js (syncSteps mode handling)",
      });
    }

    // H6. Test missing sync_mode (defaults to cumulative)
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersSyncMode,
        body: JSON.stringify({ date: targetDate, steps: 10000 }),
      });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-MODE-006",
        name: "Missing sync_mode defaults to cumulative",
        passed: res.status === 200 && data.data?.steps === 10000,
        expected: "HTTP 200, stored steps: 10000",
        actual: `HTTP ${res.status}, stored steps: ${data.data?.steps}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js",
      });
    }

    // ----------------------------------------------------
    // CATEGORY I: DUPLICATE / SAME-DATE BEHAVIOR
    // ----------------------------------------------------
    console.log("\n--- CATEGORY I: DUPLICATE / SAME-DATE BEHAVIOR ---");
    const userDup = await createTestUser("dup");
    const headersDup = {
      Authorization: `Bearer ${userDup.token}`,
      "Content-Type": "application/json",
    };
    const dupDate = getDaysAgoStr(9);

    // Sync 3 times on same date
    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersDup, body: JSON.stringify({ date: dupDate, steps: 4000 }) });
    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersDup, body: JSON.stringify({ date: dupDate, steps: 6000 }) });
    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersDup, body: JSON.stringify({ date: dupDate, steps: 10000 }) });

    // I1. DB record count
    {
      const count = await DailyActivity.countDocuments({ user: userDup.user._id, date: dupDate });
      recordResult({
        category: "SYNC",
        id: "TC-DUP-001",
        name: "Syncing same date multiple times updates single record without creating duplicates",
        passed: count === 1,
        expected: "DB record count: 1",
        actual: `DB record count: ${count}`,
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/models/dailyActivity.model.js (unique index on user+date)",
      });
    }

    // I2. History count does not grow
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/history`, { headers: headersDup });
      const data = await res.json();
      recordResult({
        category: "SYNC",
        id: "TC-DUP-002",
        name: "History endpoint returns single item for updated date",
        passed: res.status === 200 && data.count === 1,
        expected: "HTTP 200, count: 1",
        actual: `HTTP ${res.status}, count: ${data.count}`,
        endpoint: "GET /api/services/steps/history",
        fileResponsible: "src/services/steps/step.service.js (getHistory)",
      });
    }

    // I3. Calculated metrics updated
    {
      const doc = await DailyActivity.findOne({ user: userDup.user._id, date: dupDate });
      recordResult({
        category: "SYNC",
        id: "TC-DUP-003",
        name: "Distance, calories, pace recalculated on same-date sync update",
        passed: doc && doc.steps === 10000 && doc.distance_km > 0 && doc.estimated_calories_burned > 0 && doc.goal_completed === true,
        expected: "steps: 10000, distance_km > 0, calories > 0, goal_completed: true",
        actual: doc ? `steps: ${doc.steps}, distance: ${doc.distance_km}, cal: ${doc.estimated_calories_burned}, completed: ${doc.goal_completed}` : "No doc",
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/services/steps/step.service.js",
      });
    }

    // ----------------------------------------------------
    // CATEGORY J: ANALYTICS & CALCULATION ACCURACY
    // ----------------------------------------------------
    console.log("\n--- CATEGORY J: ANALYTICS & CALCULATION ACCURACY ---");
    const userAnalytics = await createTestUser("analytics");
    const headersAnalytics = {
      Authorization: `Bearer ${userAnalytics.token}`,
      "Content-Type": "application/json",
    };

    const dataset = [
      { date: getDaysAgoStr(6), steps: 5000, active_minutes: 30 },
      { date: getDaysAgoStr(5), steps: 10000, active_minutes: 60 },
      { date: getDaysAgoStr(4), steps: 12000, active_minutes: 75 },
      { date: getDaysAgoStr(3), steps: 8000, active_minutes: 50 },
      { date: getDaysAgoStr(2), steps: 15000, active_minutes: 90 },
    ];

    for (const item of dataset) {
      await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersAnalytics,
        body: JSON.stringify(item),
      });
    }

    // J1. GET /weekly
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/weekly`, { headers: headersAnalytics });
      const data = await res.json();
      const w = data.data;
      const p = res.status === 200 &&
        w?.total_steps === 50000 &&
        w?.avg_steps_per_day === 10000 &&
        w?.best_day?.steps === 15000 &&
        w?.goals_completed === 3 &&
        w?.days_tracked === 5 &&
        w?.total_active_minutes === 305;

      recordResult({
        category: "ANALYTICS",
        id: "TC-ANALYSIS-001",
        name: "GET /weekly calculation accuracy (total, avg, best, goals, days)",
        passed: p,
        expected: "total: 50000, avg: 10000, best: 15000, goals: 3, days: 5, active_min: 305",
        actual: `total: ${w?.total_steps}, avg: ${w?.avg_steps_per_day}, best: ${w?.best_day?.steps}, goals: ${w?.goals_completed}, days: ${w?.days_tracked}, active_min: ${w?.total_active_minutes}`,
        endpoint: "GET /api/services/steps/weekly",
        fileResponsible: "src/services/steps/analytics.service.js (getWeeklyStats)",
      });
    }

    // J2. GET /monthly
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/monthly`, { headers: headersAnalytics });
      const data = await res.json();
      const m = data.data;
      const p = res.status === 200 &&
        m?.total_steps === 50000 &&
        m?.avg_steps_per_day === 10000 &&
        m?.best_day?.steps === 15000 &&
        m?.personal_best?.steps === 15000;

      recordResult({
        category: "ANALYTICS",
        id: "TC-ANALYSIS-002",
        name: "GET /monthly calculation accuracy",
        passed: p,
        expected: "total: 50000, avg: 10000, best_day: 15000, personal_best: 15000",
        actual: `total: ${m?.total_steps}, avg: ${m?.avg_steps_per_day}, best: ${m?.best_day?.steps}, pb: ${m?.personal_best?.steps}`,
        endpoint: "GET /api/services/steps/monthly",
        fileResponsible: "src/services/steps/analytics.service.js (getMonthlyStats)",
      });
    }

    // J3. GET /stats
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/stats`, { headers: headersAnalytics });
      const data = await res.json();
      const s = data.data;
      const p = res.status === 200 &&
        s?.total_days_tracked === 5 &&
        s?.highest_steps_in_a_day?.steps === 15000 &&
        s?.avg_steps === 10000;

      recordResult({
        category: "ANALYTICS",
        id: "TC-ANALYSIS-003",
        name: "GET /stats overall statistics accuracy",
        passed: p,
        expected: "days_tracked: 5, highest_steps: 15000, avg_steps: 10000",
        actual: `days_tracked: ${s?.total_days_tracked}, highest: ${s?.highest_steps_in_a_day?.steps}, avg: ${s?.avg_steps}`,
        endpoint: "GET /api/services/steps/stats",
        fileResponsible: "src/services/steps/analytics.service.js (getOverallStats)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY K: STREAK TESTING
    // ----------------------------------------------------
    console.log("\n--- CATEGORY K: STREAK TESTING ---");

    // K1. 3 consecutive completed days ending yesterday
    {
      const userStreak1 = await createTestUser("streak1");
      const headersStreak1 = { Authorization: `Bearer ${userStreak1.token}`, "Content-Type": "application/json" };

      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak1, body: JSON.stringify({ date: getDaysAgoStr(3), steps: 10000 }) });
      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak1, body: JSON.stringify({ date: getDaysAgoStr(2), steps: 10000 }) });
      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak1, body: JSON.stringify({ date: getDaysAgoStr(1), steps: 10000 }) });

      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersStreak1 });
      const data = await res.json();
      recordResult({
        category: "STREAK",
        id: "TC-STREAK-001",
        name: "3 consecutive completed days gives current_streak = 3",
        passed: res.status === 200 && data.data?.current_streak === 3 && data.data?.longest_streak === 3,
        expected: "HTTP 200, current_streak: 3, longest_streak: 3",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}, longest_streak: ${data.data?.longest_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/utils/steps_calculator.js (calculateCurrentStreak / calculateLongestStreak)",
      });
    }

    // K2. Missing day breaks streak
    {
      const userStreak2 = await createTestUser("streak2");
      const headersStreak2 = { Authorization: `Bearer ${userStreak2.token}`, "Content-Type": "application/json" };

      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak2, body: JSON.stringify({ date: getDaysAgoStr(3), steps: 10000 }) });
      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak2, body: JSON.stringify({ date: getDaysAgoStr(1), steps: 10000 }) });

      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersStreak2 });
      const data = await res.json();
      recordResult({
        category: "STREAK",
        id: "TC-STREAK-002",
        name: "Missing day breaks current streak (current_streak = 1, longest = 1)",
        passed: res.status === 200 && data.data?.current_streak === 1,
        expected: "HTTP 200, current_streak: 1",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/utils/steps_calculator.js (calculateCurrentStreak)",
      });
    }

    // K3. Day below goal breaks streak
    {
      const userStreak3 = await createTestUser("streak3");
      const headersStreak3 = { Authorization: `Bearer ${userStreak3.token}`, "Content-Type": "application/json" };

      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak3, body: JSON.stringify({ date: getDaysAgoStr(3), steps: 10000 }) });
      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak3, body: JSON.stringify({ date: getDaysAgoStr(2), steps: 5000 }) });
      await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak3, body: JSON.stringify({ date: getDaysAgoStr(1), steps: 10000 }) });

      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersStreak3 });
      const data = await res.json();
      recordResult({
        category: "STREAK",
        id: "TC-STREAK-003",
        name: "Day below goal breaks current streak (current_streak = 1)",
        passed: res.status === 200 && data.data?.current_streak === 1,
        expected: "HTTP 200, current_streak: 1",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/utils/steps_calculator.js (calculateCurrentStreak)",
      });
    }

    // K4. Historical streak vs current streak
    {
      const userStreak4 = await createTestUser("streak4");
      const headersStreak4 = { Authorization: `Bearer ${userStreak4.token}`, "Content-Type": "application/json" };

      for (let i = 10; i >= 6; i--) {
        await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersStreak4, body: JSON.stringify({ date: getDaysAgoStr(i), steps: 10000 }) });
      }

      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersStreak4 });
      const data = await res.json();
      recordResult({
        category: "STREAK",
        id: "TC-STREAK-004",
        name: "Historical 5-day streak correctly sets longest_streak = 5 and current_streak = 0",
        passed: res.status === 200 && data.data?.longest_streak === 5 && data.data?.current_streak === 0,
        expected: "HTTP 200, current_streak: 0, longest_streak: 5",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}, longest_streak: ${data.data?.longest_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/utils/steps_calculator.js (calculateLongestStreak)",
      });
    }

    // ----------------------------------------------------
    // CATEGORY L: USER ISOLATION (SECURITY)
    // ----------------------------------------------------
    console.log("\n--- CATEGORY L: USER ISOLATION (SECURITY) ---");

    const userIsoA = await createTestUser("iso_a");
    const userIsoB = await createTestUser("iso_b");

    const headersIsoA = { Authorization: `Bearer ${userIsoA.token}`, "Content-Type": "application/json" };
    const headersIsoB = { Authorization: `Bearer ${userIsoB.token}`, "Content-Type": "application/json" };

    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersIsoA, body: JSON.stringify({ date: getDaysAgoStr(3), steps: 10000 }) });
    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersIsoA, body: JSON.stringify({ date: getDaysAgoStr(2), steps: 12000 }) });
    await fetch(`${BASE_URL}/api/services/steps/sync`, { method: "POST", headers: headersIsoA, body: JSON.stringify({ date: getDaysAgoStr(1), steps: 15000 }) });

    // L1. GET /today for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/today`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-001",
        name: "User B cannot see User A's today activity data",
        passed: res.status === 200 && data.data?.steps === 0,
        expected: "HTTP 200, steps: 0 for User B",
        actual: `HTTP ${res.status}, steps: ${data.data?.steps}`,
        endpoint: "GET /api/services/steps/today",
        fileResponsible: "src/routes/steps.route.js / protect middleware",
      });
    }

    // L2. GET /history for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/history`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-002",
        name: "User B cannot see User A's activity history",
        passed: res.status === 200 && data.count === 0 && data.data?.length === 0,
        expected: "HTTP 200, count: 0, data: []",
        actual: `HTTP ${res.status}, count: ${data.count}`,
        endpoint: "GET /api/services/steps/history",
        fileResponsible: "src/services/steps/step.service.js (getHistory)",
      });
    }

    // L3. GET /weekly for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/weekly`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-003",
        name: "User B cannot see User A's weekly analytics",
        passed: res.status === 200 && data.data?.total_steps === 0,
        expected: "HTTP 200, total_steps: 0",
        actual: `HTTP ${res.status}, total_steps: ${data.data?.total_steps}`,
        endpoint: "GET /api/services/steps/weekly",
        fileResponsible: "src/services/steps/analytics.service.js",
      });
    }

    // L4. GET /monthly for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/monthly`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-004",
        name: "User B cannot see User A's monthly analytics",
        passed: res.status === 200 && data.data?.total_steps === 0,
        expected: "HTTP 200, total_steps: 0",
        actual: `HTTP ${res.status}, total_steps: ${data.data?.total_steps}`,
        endpoint: "GET /api/services/steps/monthly",
        fileResponsible: "src/services/steps/analytics.service.js",
      });
    }

    // L5. GET /stats for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/stats`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-005",
        name: "User B cannot see User A's overall statistics",
        passed: res.status === 200 && data.data?.total_days_tracked === 0,
        expected: "HTTP 200, total_days_tracked: 0",
        actual: `HTTP ${res.status}, total_days_tracked: ${data.data?.total_days_tracked}`,
        endpoint: "GET /api/services/steps/stats",
        fileResponsible: "src/services/steps/analytics.service.js",
      });
    }

    // L6. GET /streak for User B
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/streak`, { headers: headersIsoB });
      const data = await res.json();
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-006",
        name: "User B cannot see User A's streaks",
        passed: res.status === 200 && data.data?.current_streak === 0 && data.data?.longest_streak === 0,
        expected: "HTTP 200, current_streak: 0, longest_streak: 0",
        actual: `HTTP ${res.status}, current_streak: ${data.data?.current_streak}`,
        endpoint: "GET /api/services/steps/streak",
        fileResponsible: "src/services/steps/analytics.service.js",
      });
    }

    // L7. Prevent user_id override tampering in sync payload
    {
      const res = await fetch(`${BASE_URL}/api/services/steps/sync`, {
        method: "POST",
        headers: headersIsoB,
        body: JSON.stringify({
          user_id: userIsoA.user._id,
          date: getDaysAgoStr(1),
          steps: 99999,
        }),
      });

      const docA = await DailyActivity.findOne({ user: userIsoA.user._id, date: getDaysAgoStr(1) });
      recordResult({
        category: "SECURITY",
        id: "TC-SEC-007",
        name: "User B passing User A's user_id in payload cannot mutate User A's record",
        passed: docA && docA.steps === 15000,
        expected: "User A's record steps remain 15000",
        actual: docA ? `User A's steps: ${docA.steps}` : "User A record missing",
        endpoint: "POST /api/services/steps/sync",
        fileResponsible: "src/routes/steps.route.js (uses req.user.id from JWT token)",
      });
    }

  } catch (err) {
    console.error("Critical error during test execution:", err);
  } finally {
    console.log("\n🧹 Cleaning up generated test data...");
    await User.deleteMany({ email: { $regex: /@rovr\.test$/ } });
    await DailyActivity.deleteMany({});
    console.log("✅ Cleanup complete.");

    server.close();
    await mongoose.connection.close();
  }

  printFinalReport();
}

function printFinalReport() {
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;
  const skipped = 0;

  console.log("\n==================================================");
  console.log("FINAL TEST REPORT");
  console.log("==================================================");
  console.log(`Total tests: ${total}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Skipped:     ${skipped}`);
  console.log("==================================================\n");

  const categories = [
    "AUTH",
    "VALIDATION",
    "DATE",
    "GOAL",
    "SYNC",
    "ANALYTICS",
    "STREAK",
    "SECURITY",
    "EMPTY STATE",
  ];

  console.log("GROUPED FAILURES:\n");

  let totalBugs = 0;
  const bugList = [];

  for (const cat of categories) {
    const catFailures = testResults.filter((t) => !t.passed && t.category === cat);
    console.log(`${cat}:`);
    if (catFailures.length === 0) {
      console.log("  None\n");
    } else {
      catFailures.forEach((f) => {
        totalBugs++;
        console.log(`  - [${f.id}] ${f.name}`);
        console.log(`    Expected: ${JSON.stringify(f.expected)}`);
        console.log(`    Actual:   ${JSON.stringify(f.actual)}`);
        console.log(`    Reason:   ${f.reason}`);
        console.log(`    Endpoint: ${f.endpoint}`);
        console.log(`    File:     ${f.fileResponsible}\n`);

        bugList.push({
          num: totalBugs,
          id: f.id,
          name: f.name,
          endpoint: f.endpoint,
          expected: f.expected,
          actual: f.actual,
          reason: f.reason,
          file: f.fileResponsible,
        });
      });
    }
  }

  console.log("==================================================");
  console.log("IDENTIFIED BUGS");
  console.log("==================================================");
  if (bugList.length === 0) {
    console.log("No bugs found! All test cases passed.\n");
  } else {
    bugList.forEach((b) => {
      console.log(`BUG #${b.num}`);
      console.log(`Endpoint:      ${b.endpoint}`);
      console.log(`Test Case:     [${b.id}] ${b.name}`);
      console.log(`Expected:      ${JSON.stringify(b.expected)}`);
      console.log(`Actual:        ${JSON.stringify(b.actual)}`);
      console.log(`Likely cause:  ${b.reason}`);
      console.log(`File:          ${b.file}`);
      console.log("--------------------------------------------------");
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
