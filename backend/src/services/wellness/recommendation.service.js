/**
 * Recommendation Service — Rule-based, phase-aware wellness guidance.
 *
 * No LLM. Per RESULT.md §14, this must never diagnose conditions, confirm
 * pregnancy, act as contraception, or prescribe medication — guidance stays
 * general and wellness-oriented, and the disclaimer is returned with every
 * response rather than left to the caller to add.
 */

const PHASE_BASELINE = {
  MENSTRUAL: {
    food: "Iron-rich foods (leafy greens, lentils) and warm, hydrating meals.",
    workout: "Low intensity — walking, gentle yoga, or rest as needed.",
    hydration: "Slightly increase water intake to offset fluid loss.",
  },
  FOLLICULAR: {
    food: "Protein and fresh produce to support rising energy levels.",
    workout: "Good window for higher-intensity training as energy builds.",
    hydration: "Standard daily hydration target.",
  },
  OVULATION: {
    food: "Fiber and antioxidant-rich foods (berries, cruciferous vegetables).",
    workout: "Peak intensity is usually well tolerated — strength or cardio.",
    hydration: "Standard daily hydration target.",
  },
  LUTEAL: {
    food: "Magnesium and calcium-rich foods (nuts, seeds, dairy or fortified alternatives) to ease PMS.",
    workout: "Moderate intensity; scale back if fatigue or cramping increases.",
    hydration:
      "Slightly increase water intake — bloating is common pre-period.",
  },
};

const SYMPTOM_NOTES = {
  CRAMPS: "Gentle stretching or a heating pad may help with cramping.",
  HEADACHE:
    "Make sure you're hydrated; consider reducing screen time and caffeine.",
  FATIGUE: "It's okay to scale back workout intensity today.",
  BLOATING: "Reducing sodium intake today may help with bloating.",
  BACK_PAIN:
    "Light stretching or a warm compress may ease lower back discomfort.",
};

const DISCLAIMER =
  "These are general wellness suggestions, not medical advice. They don't diagnose conditions, confirm pregnancy, or replace guidance from a healthcare professional.";

/**
 * @param {Object} params
 * @param {string} params.phase - one of MENSTRUAL | FOLLICULAR | OVULATION | LUTEAL
 * @param {string[]} [params.symptoms] - today's logged symptoms
 * @returns {{ food: string, workout: string, hydration: string, general: string[], disclaimer: string }}
 */
export function generateRecommendations({ phase, symptoms = [] }) {
  const baseline = PHASE_BASELINE[phase] || PHASE_BASELINE.FOLLICULAR;
  const general = symptoms
    .map((symptom) => SYMPTOM_NOTES[symptom])
    .filter(Boolean);

  return {
    food: baseline.food,
    workout: baseline.workout,
    hydration: baseline.hydration,
    general,
    disclaimer: DISCLAIMER,
  };
}
