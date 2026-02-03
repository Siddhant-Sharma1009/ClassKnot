import QRSession from "../models/QRSession.js";
import QRSubmission from "../models/QRSubmission.js";   
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import Student from "../models/Student.js";
import ClassSession from "../models/ClassSession.js";


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
    token
  } = req.body;

  try {
    /* 🔑 RESOLVE USER → STUDENT (FINAL & CORRECT) */
    const student = await Student.findOne({
      userId: req.user.userId
    });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found"
      });
    }

    const studentId = student._id; // ✅ ATTENDANCE ID

    /* =============================
       VALIDATE QR SESSION
       ============================= */
    const session = await QRSession.findById(qrSessionId);

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
       PREVENT DUPLICATE SUBMISSION
       ============================= */
    const alreadySubmitted = await QRSubmission.findOne({
      qrSessionId,
      studentId
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        message: "Attendance already submitted for this session"
      });
    }

    /* =============================
       SAVE QR SUBMISSION
       ============================= */
    await QRSubmission.create({
      qrSessionId,
      attendanceSlotId,
      studentId,           // ✅ Student._id
      rowNumber: row,
      qrToken: token
    });

    return res.json({ message: "Attendance submitted" });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Attendance already submitted for this session"
      });
    }

    console.error("submitQR error:", err);
    return res.status(500).json({
      message: "Failed to submit attendance"
    });
  }
};


export const getQRPreview = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    // 1️⃣ Get raw submissions
    const submissions = await QRSubmission.find({ qrSessionId }).lean();

    // 2️⃣ Collect studentIds
    const studentIds = submissions.map(s => s.studentId);

    // 3️⃣ Fetch students explicitly
    const students = await Student.find({
      _id: { $in: studentIds }
    })
      .select("_id collegeId name")
      .lean();

    // 4️⃣ Build lookup map
    const studentMap = {};
    students.forEach(st => {
      studentMap[st._id.toString()] = st;
    });

    // 5️⃣ Attach collegeId manually
    const enrichedSubmissions = submissions.map(s => ({
      ...s,
      studentId: studentMap[s.studentId.toString()] || null
    }));

    // 6️⃣ Row stats
    const rowStats = {};
    for (let i = 1; i <= qrSession.totalRows; i++) {
      rowStats[i] = 0;
    }

    enrichedSubmissions.forEach(s => {
      if (rowStats[s.rowNumber] !== undefined) {
        rowStats[s.rowNumber] += 1;
      }
    });

    res.json({
      submissions: enrichedSubmissions,
      rowStats,
      totalRows: qrSession.totalRows
    });

  } catch (err) {
    console.error("QR preview error:", err);
    res.status(500).json({ message: "Failed to load preview" });
  }
};






export const saveQRAttendance = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    // 1️⃣ Get QR session
    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    const attendanceSlotId = qrSession.attendanceSlotId;

    // 2️⃣ Students who scanned QR (PRESENT)
    const qrSubmissions = await QRSubmission.find({ qrSessionId })
      .select("studentId");

    const presentStudentIds = new Set(
      qrSubmissions.map(s => s.studentId.toString())
    );

    // 3️⃣ Get ALL attendance records for this slot
    const records = await AttendanceRecord.find({
      attendanceSlotId
    });

    // 4️⃣ Update existing records
    for (const record of records) {
      const isPresent = presentStudentIds.has(
        record.studentId.toString()
      );

      if (isPresent) {
        record.status = "P";
        record.method = "QR";
        await record.save();
      }
    }

    // 5️⃣ Close QR session
    qrSession.isActive = false;
    await qrSession.save();

    res.json({ message: "Attendance saved successfully" });

  } catch (err) {
    console.error("QR save error:", err);
    res.status(500).json({ message: "Failed to save attendance" });
  }
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

  // STORE CURRENT VALID TOKEN ON SERVER
  session.currentToken = token;
  session.tokenExpiresAt = expiresAt;
  await session.save();

  res.json({
  qrSessionId,
  attendanceSlotId: session.attendanceSlotId,
  row: session.currentRow,
  token,
  expiresAt,
  serverNow: Date.now() 
});

};
