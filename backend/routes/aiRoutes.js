import express from "express";
import axios from "axios";

const router = express.Router();
const AI_SERVER = "http://127.0.0.1:7000";

router.post("/start", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Camera URL required" });

  await axios.post(`${AI_SERVER}/start`, { url });
  res.json({ message: "AI started" });
});

router.get("/count", async (req, res) => {
  const aiRes = await axios.get(`${AI_SERVER}/count`);
  res.json(aiRes.data);
});

router.post("/stop", async (req, res) => {
  await axios.post(`${AI_SERVER}/stop`);
  res.json({ message: "AI stopped" });
});

export default router;
