import mongoose from "mongoose";
import crypto from "crypto";
import QRSession from "../models/QRSession.js";
import QRSubmission from "../models/QRSubmission.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";

export const startQRSession = async (req, res) => {
  try {
    const { attendanceSlotId } = req.body;

    if (!attendanceSlotId || !mongoose.Types.ObjectId.isValid(attendanceSlotId)) {
      return res.status(400).json({ message: "Invalid attendance slot id" });
    }

    const slot = await AttendanceSlot.findById(attendanceSlotId);
    if (!slot) {
      return res.status(404).json({ message: "Attendance slot not found" });
    }

    const qrSession = await QRSession.create({ attendanceSlotId });
    return res.json(qrSession);
  } catch (err) {
    console.error("startQRSession error:", err);
    return res.status(500).json({ message: "Failed to start QR session" });
  }
};

export const submitQR = async (req, res) => {
  try {
    const { qrSessionId, attendanceSlotId, token } = req.body;

    const session = await QRSession.findById(qrSessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ message: "QR session inactive" });
    }

    if (String(session.attendanceSlotId) !== String(attendanceSlotId)) {
      return res.status(400).json({ message: "QR slot mismatch" });
    }

    const now = Date.now();
    const isCurrentToken = session.currentToken === token;
    const isPreviousToken = session.previousToken === token;
    const isCurrentTokenValid =
      isCurrentToken && session.tokenExpiresAt && now <= session.tokenExpiresAt;
    const isPreviousTokenValid =
      isPreviousToken &&
      session.previousTokenExpiresAt &&
      now <= session.previousTokenExpiresAt;

    if (!isCurrentTokenValid && !isPreviousTokenValid) {
      if (isCurrentToken || isPreviousToken) {
        return res.status(400).json({ message: "QR expired" });
      }
      return res.status(400).json({ message: "QR token invalid" });
    }

    await QRSubmission.create({
      qrSessionId,
      attendanceSlotId,
      studentId: req.user.userId,
      qrToken: token
    });

    return res.json({ message: "Attendance submitted" });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Attendance already submitted" });
    }
    console.error("submitQR error:", err);
    return res.status(500).json({ message: "Failed to submit attendance" });
  }
};

export const getQRPreview = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    const submissions = await QRSubmission.find({ qrSessionId }).populate(
      "studentId",
      "collegeId name"
    );

    return res.json({
      submissions,
      attendanceSlotId: qrSession.attendanceSlotId,
      totalSubmissions: submissions.length
    });
  } catch (err) {
    console.error("getQRPreview error:", err);
    return res.status(500).json({ message: "Failed to load QR preview" });
  }
};

export const saveQRAttendance = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    const submissions = await QRSubmission.find({ qrSessionId });
    const presentStudentIds = [...new Set(submissions.map((s) => s.studentId.toString()))];

    if (presentStudentIds.length > 0) {
      await AttendanceRecord.updateMany(
        {
          attendanceSlotId: qrSession.attendanceSlotId,
          studentId: { $in: presentStudentIds }
        },
        { status: "P", method: "QR" }
      );
    }

    await AttendanceRecord.updateMany(
      {
        attendanceSlotId: qrSession.attendanceSlotId,
        studentId: { $nin: presentStudentIds }
      },
      { status: "A" }
    );

    return res.json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error("saveQRAttendance error:", err);
    return res.status(500).json({ message: "Failed to save QR attendance" });
  }
};

export const retakeQR = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    qrSession.isActive = false;
    await qrSession.save();

    await QRSubmission.deleteMany({ qrSessionId });

    return res.json({
      message: "QR retake initialized",
      attendanceSlotId: qrSession.attendanceSlotId
    });
  } catch (err) {
    console.error("retakeQR error:", err);
    return res.status(500).json({ message: "Failed to retake QR session" });
  }
};

export const endQRSession = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const session = await QRSession.findById(qrSessionId);
    if (!session) {
      return res.status(404).json({ message: "QR session not found" });
    }

    session.isActive = false;
    await session.save();

    return res.json({ message: "QR session ended" });
  } catch (err) {
    console.error("endQRSession error:", err);
    return res.status(500).json({ message: "Failed to end QR session" });
  }
};

export const generateQR = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const session = await QRSession.findById(qrSessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ message: "QR session ended" });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + 10000;

    session.previousToken = session.currentToken;
    session.previousTokenExpiresAt = session.tokenExpiresAt;

    session.currentToken = token;
    session.tokenExpiresAt = expiresAt;
    await session.save();

    return res.json({
      qrSessionId,
      attendanceSlotId: session.attendanceSlotId,
      token,
      expiresAt
    });
  } catch (err) {
    console.error("generateQR error:", err);
    return res.status(500).json({ message: "Failed to generate QR" });
  }
};
