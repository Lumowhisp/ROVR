import express from "express";
import { signin, signup, getMe } from "../controller/auth.control.js";
import { protect } from "../Middleware/protect.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, getMe);

export default router;
