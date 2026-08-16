/**
 * Prediction Service — Pure, deterministic cycle-length prediction.
 *
 * No ML, per RESULT.md §12. Historical averaging only. No DB access —
 * accepts already-fetched cycle data and returns structured predictions,
 * including an explicit low/insufficient-data state rather than pretending
 * accuracy that isn't there.
 */

const DEFAULT_CYCLE_LENGTH = 28;

function average(nums) {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function stdDev(nums, mean) {
  if (nums.length < 2) return 0;
  const variance =
    nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

/**
 * @param {Array<{cycleStart: Date|string}>} cycles - any order; will be sorted internally
 * @returns {{
 *   status: 'insufficient_data' | 'low_confidence' | 'ok',
 *   predictedNextPeriod: Date | null,
 *   predictedCycleLength: number | null,
 *   confidence: number | null,
 *   dataPoints: number
 * }}
 */
export function predictNextCycle(cycles) {
  if (!cycles || cycles.length === 0) {
    return {
      status: "insufficient_data",
      predictedNextPeriod: null,
      predictedCycleLength: null,
      confidence: null,
      dataPoints: 0,
    };
  }

  const sorted = [...cycles].sort(
    (a, b) => new Date(a.cycleStart) - new Date(b.cycleStart),
  );
  const lastStart = new Date(sorted[sorted.length - 1].cycleStart);

  if (sorted.length === 1) {
    // Single data point: fall back to the population-average cycle length
    // as an explicitly low-confidence placeholder.
    const predicted = new Date(lastStart);
    predicted.setDate(predicted.getDate() + DEFAULT_CYCLE_LENGTH);
    return {
      status: "low_confidence",
      predictedNextPeriod: predicted,
      predictedCycleLength: DEFAULT_CYCLE_LENGTH,
      confidence: 0.2,
      dataPoints: 1,
    };
  }

  const lengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const diffMs =
      new Date(sorted[i].cycleStart) - new Date(sorted[i - 1].cycleStart);
    lengths.push(Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  const avgLength = average(lengths);
  const sd = stdDev(lengths, avgLength);

  // Confidence heuristic: tighter historical variance -> higher confidence.
  // stdDev of 0 days => confidence 1; stdDev >= 7 days => confidence floors at 0.3.
  const confidence = Math.max(0.3, Math.min(1, 1 - sd / 7));

  const predicted = new Date(lastStart);
  predicted.setDate(predicted.getDate() + Math.round(avgLength));

  return {
    status: "ok",
    predictedNextPeriod: predicted,
    predictedCycleLength: Math.round(avgLength),
    confidence: Math.round(confidence * 100) / 100,
    dataPoints: sorted.length,
  };
}
