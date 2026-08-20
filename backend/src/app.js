import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/auth.route.js";
import onboardRoutes from "./routes/onboard.route.js";
import profileRoutes from "./routes/profile.route.js";
import stepsRoutes from "./routes/steps.route.js";
import limitRatingRoutes from "./routes/limitRating.route.js";
import hydrationRoutes from "./routes/hydration.route.js";
import roadsRoutes from "./routes/roads.route.js";

const app = express();
app.use(morgan("dev"));
app.use((req, res, next) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim());
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = allowedOrigins.includes("*");

  if (allowAnyOrigin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
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
app.use("/api/onboard", limitRatingRoutes);
app.use("/api/hydration", hydrationRoutes);
app.use("/api/roads", roadsRoutes);

app.use("/api/services/profile", (req, res, next) => {
  console.log("Profile middleware hit:", req.method, req.originalUrl);
  next();
});

app.use("/api/services/profile", profileRoutes);
console.log("profileRoutes =", profileRoutes);

app.use("/api/services/steps", stepsRoutes);

export default app;
