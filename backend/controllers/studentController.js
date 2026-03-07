import Student from "../models/Student.js";
import User from "../models/User.js";
import ClassSession from "../models/ClassSession.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Subject from "../models/Subject.js";
import bcrypt from "bcryptjs";

/* ===================== EXISTING (UNCHANGED) ===================== */
export const getMyProfile = async (req, res) => {
  const student = await Student.findOne({ userId: req.user.userId });

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  res.json(student);
};

export const getMyClasses = async (req, res) => {
  const student = await Student.findOne({ userId: req.user.userId });

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  const classes = await ClassSession.find({
    branch: student.branch,
    semester: student.semester,
    $or: [
      { section: student.section },
      { group: student.group },
      { section: null, group: null }
    ]
  });

  res.json(classes);
};

export const getMyAttendance = async (req, res) => {
  const student = await Student.findOne({ userId: req.user.userId });

  if (!student) {
    return res.status(404).json({ message: "Student profile not found" });
  }

  const slots = await AttendanceSlot.find({ classId: req.params.classId });

  const records = await AttendanceRecord.find({
    attendanceSlotId: { $in: slots.map(s => s._id) },
    studentId: student._id
  });

  const present = records.filter(r => r.status === "P").length;

  res.json({
    total: records.length,
    present,
    percentage: records.length
      ? ((present / records.length) * 100).toFixed(2)
      : 0
  });
};

/* ===================== NEW (ADDED ONLY) ===================== */
/**
 * GET /api/student/attendance
 * Dashboard → subject-wise attendance summary
 */
export const getMyAttendanceSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // 1️⃣ All classes student belongs to
    const classes = await ClassSession.find({
      branch: student.branch,
      semester: student.semester,
      $or: [
        { section: student.section },
        { group: student.group },
        { section: null, group: null }
      ]
    });

    const classIds = classes.map(c => c._id);

    // 2️⃣ All attendance slots of those classes
    const slots = await AttendanceSlot.find({
      classId: { $in: classIds }
    });

    // Group slots by subject
    const slotsBySubject = {};
    slots.forEach(slot => {
      if (!slotsBySubject[slot.subject]) {
        slotsBySubject[slot.subject] = [];
      }
      slotsBySubject[slot.subject].push(slot._id);
    });

    // 3️⃣ Build summary per subject
    const summary = [];

    for (const subject of Object.keys(slotsBySubject)) {
      const records = await AttendanceRecord.find({
        attendanceSlotId: { $in: slotsBySubject[subject] },
        studentId: student._id
      });

      const present = records.filter(r => r.status === "P").length;

      summary.push({
        subject,
        total: records.length,
        present,
        percentage: records.length
          ? Math.round((present / records.length) * 100)
          : 0
      });
    }

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * GET /api/student/subjects
 * Returns ALL subjects for student's branch + semester
 */

export const getMySubjects = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // 1️⃣ Fetch subjects
    const subjects = await Subject.find({
      branch: student.branch,
      semester: student.semester
    });

    // 2️⃣ Fetch class sessions
    const classes = await ClassSession.find({
      branch: student.branch,
      semester: student.semester
    });

    const classMap = {};
    classes.forEach(cls => {
      classMap[cls.subjectCode] = cls._id;
    });

    const response = subjects.map(sub => ({
      subjectCode: sub.code,
      subjectName: sub.name,
      classId: classMap[sub.code] || null
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/student/subject/:subjectCode/attendance
 * Returns detailed attendance records for a specific subject
 */
export const getSubjectAttendance = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const student = await Student.findOne({ userId: req.user.userId });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // 1️⃣ Find all class sessions for this subject
    const classes = await ClassSession.find({
      subjectCode: subjectCode,
      branch: student.branch,
      semester: student.semester
    });

    

    if (classes.length === 0) {
      return res.json({
        subjectCode,
        attendanceRecords: [],
        summary: {
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0
        }
      });
    }

    const classIds = classes.map(c => c._id);

    // 2️⃣ Find all attendance slots for these classes
    const slots = await AttendanceSlot.find({
      classId: { $in: classIds }
    }).sort({ date: -1 });


    // 3️⃣ Find all attendance records for the student in these slots
    const records = await AttendanceRecord.find({
      attendanceSlotId: { $in: slots.map(s => s._id) },
      studentId: student._id
    }).populate("attendanceSlotId");


    // 4️⃣ Build detailed attendance list
    const attendanceRecords = slots.map(slot => {
      const record = records.find(r => r.attendanceSlotId._id.toString() === slot._id.toString());
      
      return {
        slotId: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        slotLabel: slot.slotLabel,
        status: record ? record.status : "A",
        method: record ? record.method : "MANUAL"
      };
    });

    // 5️⃣ Calculate summary
    const present = records.filter(r => r.status === "P").length;
    const absent = records.filter(r => r.status === "A").length;
    const total = records.length;

    const response = {
      subjectCode,
      attendanceRecords,
      summary: {
        total,
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      }
    };


    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===================== PASSWORD (ADDED) ===================== */
export const changeStudentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required"
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters"
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "STUDENT") {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

