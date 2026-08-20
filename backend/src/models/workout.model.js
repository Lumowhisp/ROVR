import mongoose from "mongoose";

const coordinateSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    altitude: { type: Number, default: null },
    speed: { type: Number, default: null },
    timestamp: { type: Number, default: Date.now },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workoutId: {
      type: String,
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ["walking", "running", "cycling", "hiking"],
      default: "running",
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    avgPace: {
      type: String,
      default: "0'00\"",
    },
    avgSpeed: {
      type: Number,
      default: 0,
    },
    earnedXP: {
      type: Number,
      default: 0,
    },
    steps: {
      type: Number,
      default: 0,
    },
    routeCoordinates: {
      type: [coordinateSchema],
      default: [],
    },
    startedAt: {
      type: Number,
      default: Date.now,
    },
    completedAt: {
      type: Number,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

workoutSchema.index({ user: 1, workoutId: 1 }, { unique: true });
workoutSchema.index({ user: 1, completedAt: -1 });

export const Workout = mongoose.model("Workout", workoutSchema);
