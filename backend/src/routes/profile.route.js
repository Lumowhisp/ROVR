import express from "express";
import { protect } from "../Middleware/protect.js";
import { getBMI, getMe } from "../services/profile.js";
const router = express.Router();
router.get("/getBMI", protect, getBMI);
router.get("/me", protect, getMe);

console.log(
    router.stack.map((layer) => ({
      path: layer.route?.path,
      methods: layer.route?.methods,
    }))
  );
export default router;
