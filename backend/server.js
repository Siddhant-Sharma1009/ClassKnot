import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
connectDB();

const app = express();
const APP_VERSION = process.env.APP_VERSION || "1.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGINS = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,https://class-knot.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());
app.use(express.json({ limit: "8mb", strict: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "attendance-backend" });
});

app.get("/api/version", (_req, res) => {
  res.json({
    ok: true,
    service: "attendance-backend",
    version: APP_VERSION,
    environment: NODE_ENV
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err?.message?.includes("CORS") ? 403 : 500;
  res.status(status).json({
    message: status === 403 ? "Request blocked by CORS policy" : "Internal server error"
  });
});

const server = app.listen(PORT, () => {
  console.info(`Backend listening on port ${PORT} (${NODE_ENV})`);
});

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    return;
  }
  console.error("Server startup error:", err);
});

const shutdown = (signal) => {
  console.info(`${signal} received. Shutting down backend.`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
