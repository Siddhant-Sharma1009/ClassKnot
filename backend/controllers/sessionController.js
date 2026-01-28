import crypto from "crypto";
import ClassSession from "../models/ClassSession.js";
import Student from "../models/Student.js";
import AttendanceRecord from "../models/AttendanceRecord.js";




export const createSession = async (req, res) => {
  try {
    const {
      branch,
      semester,
      subjectCode,
      section = null,
      group = null
    } = req.body;

    /* ✅ VALIDATION */
    if (!branch || !semester || !subjectCode) {
      return res.status(400).json({
        message: "Branch, Semester and Subject are mandatory"
      });
    }

    const normalizedBranch = branch.toUpperCase();
    const normalizedSemester = Number(semester);

    /* ✅ CREATE CLASS (ONLY METADATA) */
    const session = await ClassSession.create({
      teacherId: req.user.userId,
      branch: normalizedBranch,
      semester: normalizedSemester,
      subjectCode,
      section,
      group,
      qrToken: crypto.randomBytes(20).toString("hex"),
      isActive: true
    });

    /* ❌ DO NOT CREATE AttendanceRecord HERE ANYMORE */

    res.status(201).json({
      message: "Class created successfully",
      sessionId: session._id
    });

  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({
      message: "Failed to create class"
    });
  }
};




/**
 * GET all classes created by logged-in teacher
 */
export const getMyClasses = async (req, res) => {
  try {
    const classes = await ClassSession.find({
      teacherId: req.user.userId
    })
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (err) {
    console.error("Get my classes error:", err);
    res.status(500).json({
      message: "Failed to fetch classes"
    });
  }
};

