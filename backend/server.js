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

/* -------------------- CORS FIX -------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/* Preflight support */
app.options("*", cors());

/* -------------------- BODY PARSER -------------------- */
app.use(express.json());

/* -------------------- ROUTES -------------------- */
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

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
