import QRSession from "../models/QRSession.js";
import QRSubmission from "../models/QRSubmission.js";   // 🔥 THIS WAS MISSING
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import { v4 as uuid } from "uuid";
import crypto from "crypto";

export const startQRSession = async (req, res) => {
  const { attendanceSlotId, totalRows } = req.body;

  if (!totalRows || totalRows < 1) {
    return res.status(400).json({ message: "Invalid rows" });
  }

  const qrSession = await QRSession.create({
    attendanceSlotId,
    totalRows
  });

  res.json(qrSession);
};


export const nextRow = async (req, res) => {
  const { qrSessionId } = req.params;

  const session = await QRSession.findById(qrSessionId);

  if (session.currentRow < session.totalRows) {
    session.currentRow += 1;
  } else {
    session.isActive = false;
  }

  await session.save();
  res.json(session);
};


export const submitQR = async (req, res) => {
  const {
    qrSessionId,
    attendanceSlotId,
    row,
    token,
    expiresAt
  } = req.body;

  const session = await QRSession.findById(qrSessionId);

  /* =============================
     HARD BLOCK CONDITIONS
     ============================= */

  if (!session || !session.isActive) {
    return res.status(400).json({ message: "QR session inactive" });
  }

  if (session.currentRow !== row) {
    return res.status(400).json({ message: "QR row expired" });
  }

  if (session.currentToken !== token) {
    return res.status(400).json({ message: "QR token invalid" });
  }

  if (Date.now() > session.tokenExpiresAt) {
    return res.status(400).json({ message: "QR expired" });
  }

  /* =============================
     ACCEPT SUBMISSION
     ============================= */

  await QRSubmission.create({
    qrSessionId,
    attendanceSlotId,
    studentId: req.user.userId,
    rowNumber: row,
    qrToken: token
  });

  res.json({ message: "Attendance submitted" });
};


export const getQRPreview = async (req, res) => {
  const { qrSessionId } = req.params;

  const qrSession = await QRSession.findById(qrSessionId);
  if (!qrSession) {
    return res.status(404).json({ message: "QR session not found" });
  }

  const submissions = await QRSubmission.find({ qrSessionId })
    .populate("studentId", "collegeId name");

  /* Row-wise counts (initialize with 0) */
  const rowStats = {};
  for (let i = 1; i <= qrSession.totalRows; i++) {
    rowStats[i] = 0;
  }

  submissions.forEach(s => {
    rowStats[s.rowNumber] += 1;
  });

  res.json({
    submissions,
    rowStats,
    totalRows: qrSession.totalRows
  });
};


export const saveQRAttendance = async (req, res) => {
  const { qrSessionId } = req.params;

  const qrSession = await QRSession.findById(qrSessionId);
  if (!qrSession) {
    return res.status(404).json({ message: "QR session not found" });
  }

  const submissions = await QRSubmission.find({ qrSessionId });

  const presentStudentIds = [
    ...new Set(submissions.map(s => s.studentId.toString()))
  ];

  /* Mark present students */
  if (presentStudentIds.length > 0) {
    await AttendanceRecord.updateMany(
      {
        attendanceSlotId: qrSession.attendanceSlotId,
        studentId: { $in: presentStudentIds }
      },
      { status: "P", method: "QR" }
    );
  }

  /* Mark remaining as Absent */
  await AttendanceRecord.updateMany(
    {
      attendanceSlotId: qrSession.attendanceSlotId,
      studentId: { $nin: presentStudentIds }
    },
    { status: "A" }
  );

  res.json({ message: "Attendance saved successfully" });
};


export const retakeQR = async (req, res) => {
  const { qrSessionId } = req.params;

  const qrSession = await QRSession.findById(qrSessionId);
  if (!qrSession) {
    return res.status(404).json({ message: "QR session not found" });
  }

  // Deactivate old session
  qrSession.isActive = false;
  await qrSession.save();

  // Remove old submissions
  await QRSubmission.deleteMany({ qrSessionId });

  // IMPORTANT: return slotId so frontend can restart correctly
  res.json({
    message: "QR retake initialized",
    attendanceSlotId: qrSession.attendanceSlotId
  });
};

export const generateQR = async (req, res) => {
  const { qrSessionId } = req.params;

  const session = await QRSession.findById(qrSessionId);
  if (!session || !session.isActive) {
    return res.status(400).json({ message: "QR session ended" });
  }

  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 5000;

  // 🔥 STORE CURRENT VALID TOKEN ON SERVER
  session.currentToken = token;
  session.tokenExpiresAt = expiresAt;
  await session.save();

  res.json({
  qrSessionId,
  attendanceSlotId: session.attendanceSlotId,
  row: session.currentRow,
  token,
  expiresAt,
  serverNow: Date.now() // 🔥 ADD THIS
});

};
