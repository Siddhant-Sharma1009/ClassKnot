// routes/attendance.js
import express from "express";
import QRToken from "../models/QRToken.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();

router.post("/scan", async (req, res) => {
  const { studentId, sessionId, token } = req.body;

  try {
    // 1️⃣ Validate QR token
    const qr = await QRToken.findOne({ token });

    if (!qr)
      return res.status(400).json({ message: "Invalid QR" });

    if (qr.used)
      return res.status(409).json({ message: "QR already used" });

    if (Date.now() > qr.expiresAt)
      return res.status(410).json({ message: "QR expired" });

    if (qr.sessionId !== sessionId)
      return res.status(400).json({ message: "Session mismatch" });

    // 2️⃣ Enforce ONE scan per student per session
    const attendance = await Attendance.create({
      studentId,
      sessionId,
      row: qr.row
    });

    // 3️⃣ Invalidate QR immediately
    qr.used = true;
    await qr.save();

    res.json({
      success: true,
      message: "Attendance marked",
      attendance
    });

  } catch (err) {
    // 🔐 Handles duplicate scan safely
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Attendance already marked"
      });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
