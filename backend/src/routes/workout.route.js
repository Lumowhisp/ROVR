import express from "express";
import { protect } from "../Middleware/protect.js";
import {
  saveWorkout,
  getUserWorkouts,
  getUserWorkoutStats,
  getWorkoutById,
  deleteWorkout,
} from "../controller/workout.controller.js";

const router = express.Router();

router.post("/", protect, saveWorkout);
router.get("/", protect, getUserWorkouts);
router.get("/stats", protect, getUserWorkoutStats);
router.get("/:id", protect, getWorkoutById);
router.delete("/:id", protect, deleteWorkout);

export default router;
