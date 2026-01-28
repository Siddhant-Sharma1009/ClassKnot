// routes/qr.js
import express from "express";
import crypto from "crypto";
import QRToken from "../models/QRToken.js";

const router = express.Router();

router.get("/generate/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  const token = crypto.randomBytes(16).toString("hex");

  const qr = await QRToken.create({
    sessionId,
    row: getCurrentRow(sessionId), // your logic
    token,
    expiresAt: Date.now() + 5000 // 🔥 valid only 5 seconds
  });

  res.json({
    sessionId: qr.sessionId,
    row: qr.row,
    token: qr.token,
    expiresAt: qr.expiresAt
  });
});

export default router;
