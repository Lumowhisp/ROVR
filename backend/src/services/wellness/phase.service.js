/**
 * Phase Service — Pure functions for menstrual cycle phase calculation.
 *
 * No DB access here. Everything is a stateless function of its inputs,
 * matching the pattern in services/steps/steps_calculator.js.
 *
 * This is guidance, not medical certainty — see recommendation.service.js's
 * disclaimer, which applies to phase output as well.
 */

export const PHASES = ["MENSTRUAL", "FOLLICULAR", "OVULATION", "LUTEAL"];

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

// Luteal phase length is the most hormonally stable part of the cycle,
// consistently ~14 days regardless of overall cycle length. Ovulation is
// therefore estimated as (cycleLength - 14), not a fixed calendar day.
const LUTEAL_PHASE_LENGTH = 14;

function diffInDays(later, earlier) {
  const laterMidnight = new Date(later).setHours(0, 0, 0, 0);
  const earlierMidnight = new Date(earlier).setHours(0, 0, 0, 0);
  return Math.floor((laterMidnight - earlierMidnight) / (1000 * 60 * 60 * 24));
}

/**
 * @param {Object} params
 * @param {Date|string} params.cycleStart - start date of the most recent logged cycle
 * @param {Date|string} [params.currentDate] - defaults to now
 * @param {number} [params.cycleLength] - predicted/average cycle length in days
 * @param {number} [params.periodLength] - predicted/average period length in days
 * @returns {{
 *   phase: string,
 *   cycleDay: number,
 *   isOverdue: boolean,
 *   ovulationWindow: {start: number, end: number},
 *   cycleLength: number,
 *   periodLength: number
 * }}
 */
export function calculatePhase({
  cycleStart,
  currentDate = new Date(),
  cycleLength = DEFAULT_CYCLE_LENGTH,
  periodLength = DEFAULT_PERIOD_LENGTH,
}) {
  if (!cycleStart) {
    throw new Error("cycleStart is required to calculate phase");
  }

  const cycleDay = diffInDays(currentDate, cycleStart) + 1;

  if (cycleDay < 1) {
    throw new Error("currentDate cannot be before cycleStart");
  }

  const ovulationDay = Math.max(cycleLength - LUTEAL_PHASE_LENGTH, 1);
  const ovulationWindow = {
    start: Math.max(ovulationDay - 1, 1),
    end: ovulationDay + 1,
  };

  let phase;
  if (cycleDay <= periodLength) {
    phase = "MENSTRUAL";
  } else if (cycleDay < ovulationWindow.start) {
    phase = "FOLLICULAR";
  } else if (cycleDay <= ovulationWindow.end) {
    phase = "OVULATION";
  } else {
    phase = "LUTEAL";
  }

  return {
    phase,
    cycleDay,
    isOverdue: cycleDay > cycleLength,
    ovulationWindow,
    cycleLength,
    periodLength,
  };
}
