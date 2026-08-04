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

    bmi: Number,

    weight: Number,

    height: Number,

    gender: String,

    isBMI: {
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
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
