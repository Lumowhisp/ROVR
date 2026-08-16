import {
  DailyLog,
  FLOW_LEVELS,
  SYMPTOMS,
} from "../../models/dailyLog.model.js";

function validate({ flow, painLevel, symptoms }) {
  if (flow && !FLOW_LEVELS.includes(flow)) {
    throw new Error(
      `Invalid flow value. Must be one of: ${FLOW_LEVELS.join(", ")}`,
    );
  }
  if (painLevel !== undefined && (painLevel < 0 || painLevel > 10)) {
    throw new Error("painLevel must be between 0 and 10");
  }
  if (symptoms) {
    const invalid = symptoms.filter((s) => !SYMPTOMS.includes(s));
    if (invalid.length) {
      throw new Error(`Invalid symptoms: ${invalid.join(", ")}`);
    }
  }
}

/**
 * Creates or updates the log for a given date. Upsert on {user, date},
 * matching the compound unique index — same "one document per user per day"
 * shape as DailyHydration/DailyActivity.
 */
export async function upsertDailyLog(userId, data) {
  const { date } = data;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date is required in YYYY-MM-DD format");
  }

  validate(data);

  const update = { ...data };
  delete update.date;

  const log = await DailyLog.findOneAndUpdate(
    { user: userId, date },
    { $set: update, $setOnInsert: { user: userId, date } },
    { new: true, upsert: true, runValidators: true },
  );

  return log;
}

export async function getDailyLog(userId, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  const log = await DailyLog.findOne({ user: userId, date });
  if (!log) {
    throw new Error("Daily log not found for that date");
  }
  return log;
}
