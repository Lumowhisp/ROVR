import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    steps: {
      type: Number,
      default: 0,
    },
    distance_km: {
      type: Number,
      default: 0,
    },
    estimated_calories_burned: {
      type: Number,
      default: 0,
    },
    active_calories: {
      type: Number,
      default: 0,
    },
    active_minutes: {
      type: Number,
      default: 0,
    },
    avg_pace: {
      type: Number,
      default: 0,
    },
    goal_steps: {
      type: Number,
      default: 10000,
    },
    goal_completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export const DailyActivity = mongoose.model("DailyActivity", dailyActivitySchema);
