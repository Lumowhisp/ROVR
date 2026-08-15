import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    dob: Date,

    bmi: Number,

    weight: Number,

    height: Number,

    gender: String,

    limitRating: {
      type: Number,
      min: 1,
      max: 10,
    },

    isBMI: {
      type: Boolean,
      default: false,
    },

    isOnboarded: {
      type: Boolean,
      default: false,
    },

    hydration: {
      wakeTime: {
        type: String,
        default: "07:00",
      },

      sleepTime: {
        type: String,
        default: "23:00",
      },

      activityLevel: {
        type: String,
        enum: ["Sedentary", "Moderate", "Active"],
        default: "Moderate",
      },
    },

    age: Number,

    stride_length: Number,

    daily_step_goal: {
      type: Number,
      default: 10000,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
