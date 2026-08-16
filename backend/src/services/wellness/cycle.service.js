import { Cycle } from "../../models/cycle.model.js";
import { calculatePhase } from "./phase.service.js";
import { predictNextCycle } from "./prediction.service.js";

const DEFAULT_PERIOD_LENGTH = 5;

function daysBetween(later, earlier) {
  const laterMidnight = new Date(later).setHours(0, 0, 0, 0);
  const earlierMidnight = new Date(earlier).setHours(0, 0, 0, 0);
  return Math.round((laterMidnight - earlierMidnight) / (1000 * 60 * 60 * 24));
}

/**
 * Logs a new period start. Backfills cycleLength on the previous cycle now
 * that the gap between the two is known — cycleLength is never knowable at
 * creation time for the newest cycle itself.
 */
export async function createCycle(
  userId,
  { cycleStart, cycleEnd, periodLength },
) {
  if (!cycleStart) {
    throw new Error("cycleStart is required");
  }

  const start = new Date(cycleStart);
  if (isNaN(start.getTime())) {
    throw new Error("Invalid cycleStart date");
  }

  if (periodLength !== undefined && (periodLength < 1 || periodLength > 15)) {
    throw new Error("periodLength must be between 1 and 15 days");
  }

  const previousCycle = await Cycle.findOne({ user: userId }).sort({
    cycleStart: -1,
  });

  if (previousCycle && previousCycle.cycleStart < start) {
    previousCycle.cycleLength = daysBetween(start, previousCycle.cycleStart);
    await previousCycle.save();
  }

  const cycle = await Cycle.create({
    user: userId,
    cycleStart: start,
    cycleEnd: cycleEnd ? new Date(cycleEnd) : null,
    periodLength: periodLength ?? null,
  });

  return cycle;
}

/**
 * Returns the active cycle plus its computed phase and the deterministic
 * next-period prediction, combining the two pure services above with
 * historical data pulled from Mongo.
 */
export async function getCurrentCycle(userId) {
  const latest = await Cycle.findOne({ user: userId }).sort({ cycleStart: -1 });
  if (!latest) {
    throw new Error("No cycle history found");
  }

  const history = await Cycle.find({ user: userId }).sort({ cycleStart: 1 });
  const prediction = predictNextCycle(history);

  const effectiveCycleLength = prediction.predictedCycleLength ?? 28;

  const closedPeriodLengths = history
    .filter((c) => c.periodLength)
    .map((c) => c.periodLength);
  const avgPeriodLength = closedPeriodLengths.length
    ? Math.round(
        closedPeriodLengths.reduce((sum, n) => sum + n, 0) /
          closedPeriodLengths.length,
      )
    : DEFAULT_PERIOD_LENGTH;
  const effectivePeriodLength = latest.periodLength ?? avgPeriodLength;

  const phase = calculatePhase({
    cycleStart: latest.cycleStart,
    cycleLength: effectiveCycleLength,
    periodLength: effectivePeriodLength,
  });

  return { cycle: latest, phase, prediction };
}

export async function getCycleHistory(userId) {
  return Cycle.find({ user: userId }).sort({ cycleStart: -1 });
}
