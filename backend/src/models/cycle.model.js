import mongoose from "mongoose";

const cycleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cycleStart: {
      type: Date,
      required: true,
    },
    cycleEnd: {
      type: Date,
      default: null,
    },
    // Days of bleeding. Backfilled when the user closes out a cycle, or left
    // null until then.
    periodLength: {
      type: Number,
      default: null,
    },
    // Days until the *next* cycle started. Backfilled retroactively by
    // cycle.service.js when a new cycle is logged — it is never known at
    // creation time for the current/latest cycle.
    cycleLength: {
      type: Number,
      default: null,
    },
    // Written by prediction.service.js, never user input.
    predictionConfidence: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// History-based model: a user has many Cycle documents, not a unique
// current one, so no unique constraint here (unlike DailyHydration/DailyActivity).
cycleSchema.index({ user: 1, cycleStart: -1 });

export const Cycle = mongoose.model("Cycle", cycleSchema);
