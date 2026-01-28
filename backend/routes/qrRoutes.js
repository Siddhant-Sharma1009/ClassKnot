import express from "express";
import {
  startQRSession,
  generateQR,
  nextRow,
  submitQR,
  getQRPreview,
  saveQRAttendance,
  retakeQR
} from "../controllers/qrController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/start", protect, allowRoles("TEACHER"), startQRSession);
router.get("/generate/:qrSessionId", protect, allowRoles("TEACHER"), generateQR);
router.post("/next-row/:qrSessionId", protect, allowRoles("TEACHER"), nextRow);

router.post("/submit", protect, allowRoles("STUDENT"), submitQR);

router.get("/preview/:qrSessionId", protect, allowRoles("TEACHER"), getQRPreview);
router.post("/save/:qrSessionId", protect, allowRoles("TEACHER"), saveQRAttendance);
router.post(
  "/retake/:qrSessionId",
  protect,
  allowRoles("TEACHER"),
  retakeQR
);

export default router;
