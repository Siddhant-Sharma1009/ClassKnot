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

  // ✅ USE USER ID (AS YOU WANT)
  const userId = req.user.userId;

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
    studentId: userId
  });

  if (alreadySubmitted) {
    return res.status(400).json({
      message: "Attendance already submitted for this session"
    });
  }

  await QRSubmission.create({
    qrSessionId,
    attendanceSlotId,
    studentId: userId,   // ✅ USER ID
    rowNumber: row,
    qrToken: token
  });

  return res.json({ message: "Attendance submitted" });
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





export const saveQRAttendance = async (req, res) => {
  try {
    const { qrSessionId } = req.params;

    // 1️⃣ Find QR session
    const qrSession = await QRSession.findById(qrSessionId);
    if (!qrSession) {
      return res.status(404).json({ message: "QR session not found" });
    }

    // 2️⃣ Resolve AttendanceSlot → ClassSession
    const slot = await AttendanceSlot.findById(
      qrSession.attendanceSlotId
    );
    if (!slot) {
      return res.status(404).json({ message: "Attendance slot not found" });
    }

    const classSession = await ClassSession.findById(
      slot.classId
    );
    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // 3️⃣ Get QR submissions (Student._id)
    const qrSubmissions = await QRSubmission.find({ qrSessionId })
      .select("studentId");

    const presentStudentIds = new Set(
      qrSubmissions.map(s => s.studentId.toString())
    );

    // 4️⃣ Get students using CLASS metadata (CORRECT SOURCE)
    const students = await Student.find({
      branch: classSession.branch,
      semester: classSession.semester,
      section: classSession.section,
      group: classSession.group
    }).select("_id");

    // 5️⃣ Update attendance records
    for (const student of students) {
      const isPresent = presentStudentIds.has(student._id.toString());

      await AttendanceRecord.findOneAndUpdate(
        {
          attendanceSlotId: qrSession.attendanceSlotId,
          studentId: student._id
        },
        {
          status: isPresent ? "P" : "A",
          method: "QR"
        },
        { upsert: true }
      );
    }

    // 6️⃣ Close QR session
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
