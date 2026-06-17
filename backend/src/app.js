import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/auth.route.js";
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

export default app;
