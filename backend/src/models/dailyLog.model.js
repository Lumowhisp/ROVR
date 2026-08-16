import mongoose from "mongoose";

export const FLOW_LEVELS = ["NONE", "SPOTTING", "LIGHT", "MEDIUM", "HEAVY"];

export const SYMPTOMS = [
  "CRAMPS",
  "HEADACHE",
  "FATIGUE",
  "BLOATING",
  "ACNE",
  "BACK_PAIN",
  "BREAST_TENDERNESS",
];

const dailyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // "YYYY-MM-DD" — same convention as DailyActivity/DailyHydration, not a
    // Date type, to avoid timezone drift when comparing against those models.
    date: {
      type: String,
      required: true,
    },
    flow: {
      type: String,
      enum: FLOW_LEVELS,
      default: "NONE",
    },
    painLevel: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    symptoms: {
      type: [String],
      enum: SYMPTOMS,
      default: [],
    },
    // Self-reported wellness check-in values (1-5 scale each). This is
    // distinct from any workout/activity tracking elsewhere in ROVR.
    mood: {
      mood: { type: Number, min: 1, max: 5 },
      energy: { type: Number, min: 1, max: 5 },
      stress: { type: Number, min: 1, max: 5 },
      sleepQuality: { type: Number, min: 1, max: 5 },
      motivation: { type: Number, min: 1, max: 5 },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
