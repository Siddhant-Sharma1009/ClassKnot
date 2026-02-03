import QRSession from "../models/QRSession.js";
import QRSubmission from "../models/QRSubmission.js";   
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import Student from "../models/Student.js";

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

  const studentId = req.user.userId;

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


  const alreadySubmitted = await QRSubmission.findOne({
    qrSessionId,
    studentId
  });

  if (alreadySubmitted) {
    return res.status(400).json({
      message: "Attendance already submitted for this session"
    });
  }

  try {
    await QRSubmission.create({
      qrSessionId,
      attendanceSlotId,
      studentId,
      rowNumber: row,
      qrToken: token
    });

    return res.json({ message: "Attendance submitted" });

  } catch (err) {
    // (race-condition proof)
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Attendance already submitted for this session"
      });
    }
    throw err;
  }
};





export const getQRPreview = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    // 1️ Get submissions (studentId = userId)
    const submissions = await QRSubmission.find({ qrSessionId }).lean();

    // 2️ Collect userIds
    const userIds = submissions.map(s => s.studentId);

    // 3️ Find students by userId
    const students = await Student.find({
      userId: { $in: userIds }
    })
      .select("userId collegeId name")
      .lean();

    // 4️ Map userId → student
    const studentMap = {};
    students.forEach(st => {
      studentMap[st.userId.toString()] = st;
    });

    // 5️ Attach student info to submissions
    const enrichedSubmissions = submissions.map(s => ({
      ...s,
      student: studentMap[s.studentId.toString()] || null
    }));

    /* Row-wise counts */
    const rowStats = {};
    for (let i = 1; i <= qrSession.totalRows; i++) {
      rowStats[i] = 0;
    }

    enrichedSubmissions.forEach(s => {
      rowStats[s.rowNumber] += 1;
    });

    res.json({
      submissions: enrichedSubmissions,
      rowStats,
      totalRows: qrSession.totalRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const saveQrAttendance = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    //  Find QR session
    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    const attendanceSlotId = qrSession.attendanceSlotId;

    // Get QR submissions (PRESENT students)
    const qrSubmissions = await QRSubmission.find({
      qrSessionId
    }).select("studentId");

    const presentStudentIds = qrSubmissions.map(s =>
      s.studentId.toString()
    );

    // 3️ Get ALL students of this class
    const students = await Student.find({
      branch: qrSession.branch,
      semester: qrSession.semester,
      section: qrSession.section,
      group: qrSession.group
    }).select("_id");

    // 4️ Create attendance records
    const records = students.map(student => ({
      attendanceSlotId,
      studentId: student._id,
      status: presentStudentIds.includes(student._id.toString())
        ? "P"
        : "A",
      method: "QR"
    }));

    // 5️ Insert (ignore duplicates safely)
    await AttendanceRecord.insertMany(records, {
      ordered: false
    });

    // 6️ Mark QR session closed
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
