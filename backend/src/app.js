import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/auth.route.js";
import onboardRoutes from "./routes/onboard.route.js";
import profileRoutes from "./routes/profile.route.js";
const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("ROVR is Running");
});
app.get("/name", (req, res) => {
  console.log("logger");
  res.send("ADitya");
});
app.use("/api/auth", authRoutes);
app.use("/api/onboard", onboardRoutes);

app.use("/api/services/profile", (req, res, next) => {
  console.log("Profile middleware hit:", req.method, req.originalUrl);
  next();
});

app.use("/api/services/profile", profileRoutes);
console.log("profileRoutes =", profileRoutes);
export default app;
