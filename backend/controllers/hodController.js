import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import ClassSession from "../models/ClassSession.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";

const toId = (value) => String(value);

export const getHodProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("collegeId role");

    if (!user || user.role !== "HOD") {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({
      collegeId: user.collegeId,
      role: user.role
    });
  } catch (err) {
    console.error("getHodProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getHodSubjects = async (_req, res) => {
  try {
    const [subjects, classes] = await Promise.all([
      Subject.find().select("name code branch semester").sort({ semester: 1, name: 1 }),
      ClassSession.find().select("subjectCode teacherId")
    ]);

    const teacherUserIds = [...new Set(classes.map((c) => toId(c.teacherId)))];
    const teachers = await Teacher.find({ userId: { $in: teacherUserIds } })
      .select("userId name");
    const teacherNameByUserId = new Map(teachers.map((t) => [toId(t.userId), t.name]));

    const classesBySubjectCode = new Map();
    for (const cls of classes) {
      const key = cls.subjectCode;
      if (!classesBySubjectCode.has(key)) {
        classesBySubjectCode.set(key, []);
      }
      classesBySubjectCode.get(key).push(cls);
    }

    const classIds = classes.map((c) => c._id);
    const slots = classIds.length
      ? await AttendanceSlot.find({ classId: { $in: classIds } }).select("_id classId")
      : [];

    const classIdToSubjectCode = new Map(classes.map((c) => [toId(c._id), c.subjectCode]));
    const subjectSlotIds = new Map();

    for (const slot of slots) {
      const subjectCode = classIdToSubjectCode.get(toId(slot.classId));
      if (!subjectCode) continue;

      if (!subjectSlotIds.has(subjectCode)) {
        subjectSlotIds.set(subjectCode, new Set());
      }
      subjectSlotIds.get(subjectCode).add(toId(slot._id));
    }

    const slotIds = slots.map((s) => s._id);
    const slotStats = slotIds.length
      ? await AttendanceRecord.aggregate([
          { $match: { attendanceSlotId: { $in: slotIds } } },
          {
            $group: {
              _id: "$attendanceSlotId",
              totalCount: { $sum: 1 },
              presentCount: {
                $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
              }
            }
          }
        ])
      : [];

    const slotStatsById = new Map(slotStats.map((s) => [toId(s._id), s]));

    const formatted = subjects.map((subject) => {
      const subjectClasses = classesBySubjectCode.get(subject.code) || [];
      const teacherNames = [
        ...new Set(
          subjectClasses
            .map((c) => teacherNameByUserId.get(toId(c.teacherId)))
            .filter(Boolean)
        )
      ];

      const subjectSlotIdSet = subjectSlotIds.get(subject.code) || new Set();
      let totalCount = 0;
      let presentCount = 0;
      for (const slotId of subjectSlotIdSet) {
        const stats = slotStatsById.get(slotId);
        if (!stats) continue;
        totalCount += stats.totalCount || 0;
        presentCount += stats.presentCount || 0;
      }

      const attendancePercent =
        totalCount > 0 ? Number(((presentCount / totalCount) * 100).toFixed(2)) : 0;

      return {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        branch: subject.branch,
        semester: subject.semester,
        teacherNames,
        teacherName: teacherNames.length ? teacherNames.join(", ") : "Not Assigned",
        classCount: subjectClasses.length,
        slotCount: subjectSlotIdSet.size,
        attendancePercent
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error("getHodSubjects error:", err);
    return res.status(500).json({ message: "Failed to fetch subjects" });
  }
};

export const getSubjectAttendance = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subject id" });
    }

    const subject = await Subject.findById(subjectId).select("name code");
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const classes = await ClassSession.find({ subjectCode: subject.code })
      .select("_id teacherId");

    const classIds = classes.map((c) => c._id);
    const teacherUserIds = [...new Set(classes.map((c) => toId(c.teacherId)))];
    const teachers = teacherUserIds.length
      ? await Teacher.find({ userId: { $in: teacherUserIds } }).select("userId name")
      : [];

    const teacherNames = [
      ...new Set(
        classes
          .map((c) => teachers.find((t) => toId(t.userId) === toId(c.teacherId))?.name)
          .filter(Boolean)
      )
    ];

    if (!classIds.length) {
      return res.json({
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName: teacherNames.length ? teacherNames.join(", ") : "Not Assigned",
        students: [],
        totalSlots: 0,
        overallPercentage: 0
      });
    }

    const slots = await AttendanceSlot.find({ classId: { $in: classIds } }).select("_id");
    const slotIds = slots.map((s) => s._id);

    if (!slotIds.length) {
      return res.json({
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName: teacherNames.length ? teacherNames.join(", ") : "Not Assigned",
        students: [],
        totalSlots: 0,
        overallPercentage: 0
      });
    }

    const summary = await AttendanceRecord.aggregate([
      { $match: { attendanceSlotId: { $in: slotIds } } },
      {
        $group: {
          _id: "$studentId",
          present: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    const studentIds = summary.map((s) => s._id);
    const students = studentIds.length
      ? await Student.find({ _id: { $in: studentIds } }).select("collegeId name")
      : [];
    const studentById = new Map(students.map((s) => [toId(s._id), s]));

    const studentRows = summary
      .map((row) => {
        const student = studentById.get(toId(row._id));
        return {
          roll: student?.collegeId || "N/A",
          name: student?.name || "Student",
          present: row.present,
          total: row.total,
          percentage: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
        };
      })
      .sort((a, b) => a.roll.localeCompare(b.roll));

    const totalPresent = summary.reduce((acc, s) => acc + s.present, 0);
    const totalCount = summary.reduce((acc, s) => acc + s.total, 0);
    const overallPercentage =
      totalCount > 0 ? Number(((totalPresent / totalCount) * 100).toFixed(2)) : 0;

    return res.json({
      subjectName: subject.name,
      subjectCode: subject.code,
      teacherName: teacherNames.length ? teacherNames.join(", ") : "Not Assigned",
      students: studentRows,
      totalSlots: slotIds.length,
      overallPercentage
    });
  } catch (err) {
    console.error("getSubjectAttendance error:", err);
    return res.status(500).json({ message: "Attendance fetch failed" });
  }
};

export const changeHodPassword = async (req, res) => {
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

    const user = await User.findOne({
      collegeId: req.user.collegeId,
      role: "HOD"
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("changeHodPassword error:", error);
    return res.status(500).json({
      message: "Failed to change password"
    });
  }
};
