import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";
import bcrypt from "bcryptjs";
/* =========================
   GET HOD PROFILE
========================= */
export const getHodProfile = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select(
      "collegeId role"
    );

    if (!hod || hod.role !== "HOD") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(hod);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET SUBJECTS (NO DB CHANGE)
========================= */
export const getHodSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().select(
      "name code branch semester"
    );

    const formatted = subjects.map(s => ({
      _id: s._id,
      name: s.name,
      code: s.code,
      branch: s.branch,
      semester: s.semester,
      teacherName: "Assigned via sessions"
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

/* =========================
   SUBJECT ATTENDANCE SUMMARY
========================= */
export const getSubjectAttendance = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Attendance is linked by subject CODE
    const records = await Attendance.find({
      subject: subject.code
    }).populate("studentId", "roll name");

    // Group by student
    const summaryMap = {};

    records.forEach(r => {
      const sid = r.studentId._id.toString();

      if (!summaryMap[sid]) {
        summaryMap[sid] = {
          roll: r.studentId.roll || "N/A",
          name: r.studentId.name || "Student",
          present: 0,
          total: 0
        };
      }

      summaryMap[sid].total += 1;
      if (r.status === "present") {
        summaryMap[sid].present += 1;
      }
    });

    const students = Object.values(summaryMap).map(s => ({
      ...s,
      percentage:
        s.total === 0
          ? 0
          : Math.round((s.present / s.total) * 100)
    }));

    res.json({
      subjectName: subject.name,
      subjectCode: subject.code,
      students
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Attendance fetch failed" });
  }
};



/* =========================
   CHANGE HOD PASSWORD
========================= */


/* =========================
   CHANGE HOD PASSWORD
========================= */
export const changeHodPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required"
      });
    }

    // 🔥 FIX: find by collegeId (NOT _id)
    const user = await User.findOne({
      collegeId: req.user.collegeId
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // 🔐 check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect"
      });
    }

    // 🔐 hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to change password"
    });
  }
};


