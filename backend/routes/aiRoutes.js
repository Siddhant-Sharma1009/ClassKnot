import express from "express";
import axios from "axios";

const router = express.Router();
const AI_SERVER = process.env.AI_SERVER_URL || "http://127.0.0.1:7000";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);

router.post("/start", async (req, res) => {
  try {
    const { source, profile, sourceType } = req.body;

    await axios.post(`${AI_SERVER}/start`, { source, profile, sourceType }, { timeout: AI_TIMEOUT_MS });
    return res.json({ message: "AI started" });
  } catch (err) {
    console.error("AI /start proxy error:", err?.message || err);
    return res.status(502).json({ message: "Failed to reach AI service" });
  }
});

router.post("/count-frame", async (req, res) => {
  try {
    const { image, profile, source } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Camera frame required" });
    }

    const aiRes = await axios.post(
      `${AI_SERVER}/analyze-frame`,
      { image, profile, source },
      { timeout: AI_TIMEOUT_MS }
    );
    return res.json(aiRes.data);
  } catch (err) {
    console.error("AI /count-frame proxy error:", err?.message || err);
    return res.status(502).json({
      count: 0,
      instant_count: 0,
      running: false,
      error: "AI service unavailable"
    });
  }
});

router.get("/count", async (req, res) => {
  try {
    const aiRes = await axios.get(`${AI_SERVER}/count`, { timeout: AI_TIMEOUT_MS });
    return res.json(aiRes.data);
  } catch (err) {
    console.error("AI /count proxy error:", err?.message || err);
    return res.status(502).json({
      count: 0,
      running: false,
      error: "AI service unavailable"
    });
  }
});

router.post("/stop", async (req, res) => {
  try {
    await axios.post(`${AI_SERVER}/stop`, {}, { timeout: AI_TIMEOUT_MS });
    return res.json({ message: "AI stopped" });
  } catch (err) {
    console.error("AI /stop proxy error:", err?.message || err);
    return res.status(502).json({ message: "Failed to reach AI service" });
  }
});

export default router;
