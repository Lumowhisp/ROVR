import express from "express";
import { onBoard } from "../services/onboard.js";
import { protect } from "../Middleware/protect.js";

const router=express.Router();
router.post("/",protect,onBoard)
export default router;