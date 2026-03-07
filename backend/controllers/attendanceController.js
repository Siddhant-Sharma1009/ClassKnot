import mongoose from "mongoose";
import AttendanceSlot from "../models/AttendanceSlot.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import ClassSession from "../models/ClassSession.js";
import Student from "../models/Student.js";

/* ===============================
   CREATE ATTENDANCE SLOT
   =============================== */
export const createAttendanceSlot = async (req, res) => {
  try {
    const { classId } = req.params;

    // Normalize date (for daily grouping)
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Exact start time
    const startTime = new Date();

    const slot = await AttendanceSlot.findOneAndUpdate(
      { classId, date, startTime },
      { classId, date, startTime },
      { upsert: true, new: true }
    );

    const alreadyExists = await AttendanceRecord.findOne({
      attendanceSlotId: slot._id
    });
    if (alreadyExists) return res.json(slot);

    const cls = await ClassSession.findById(classId);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const filter = {
      branch: cls.branch,
      semester: cls.semester
    };
    if (cls.section) filter.section = cls.section;
    if (cls.group) filter.group = cls.group;

    const students = await Student.find(filter);

    const records = students.map(s => ({
      attendanceSlotId: slot._id,
      studentId: s._id,
      status: "A"
    }));

    await AttendanceRecord.insertMany(records);

    res.json(slot);
  } catch (err) {
    console.error("Create attendance slot error:", err);
    res.status(500).json({ message: "Failed to create attendance slot" });
  }
};

/* ===============================
   GET ATTENDANCE HISTORY
   =============================== */
export const getAttendanceSlots = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const cls = await ClassSession.findById(classId).select("teacherId");
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (String(cls.teacherId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not allowed to view this class history" });
    }

    const slots = await AttendanceSlot.find({ classId })
      .sort({ date: -1, createdAt: -1 });

    if (slots.length === 0) {
      return res.json([]);
    }

    const slotIds = slots.map((s) => s._id);
    const recordStats = await AttendanceRecord.aggregate([
      { $match: { attendanceSlotId: { $in: slotIds } } },
      {
        $group: {
          _id: "$attendanceSlotId",
          totalCount: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
          },
          manualCount: {
            $sum: { $cond: [{ $eq: ["$method", "MANUAL"] }, 1, 0] }
          },
          qrCount: {
            $sum: { $cond: [{ $eq: ["$method", "QR"] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = new Map(
      recordStats.map((s) => [String(s._id), s])
    );

    const enriched = slots.map((slot) => {
      const stats = statsMap.get(String(slot._id)) || {
        totalCount: 0,
        presentCount: 0,
        manualCount: 0,
        qrCount: 0
      };

      const absentCount = Math.max(0, stats.totalCount - stats.presentCount);
      const percentage =
        stats.totalCount > 0
          ? Number(((stats.presentCount / stats.totalCount) * 100).toFixed(2))
          : 0;

      return {
        ...slot.toObject(),
        stats: {
          totalCount: stats.totalCount,
          presentCount: stats.presentCount,
          absentCount,
          percentage,
          manualCount: stats.manualCount,
          qrCount: stats.qrCount
        }
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error("Get attendance slots error:", err);
    return res.status(500).json([]);
  }
};

/* ===============================
   GET ATTENDANCE BY SLOT
   =============================== */

export const getAttendanceBySlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    /* 🔴 CRITICAL SAFETY CHECK */
    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        message: "Invalid attendance slot id"
      });
    }

    const records = await AttendanceRecord.find({
      attendanceSlotId: slotId
    }).populate("studentId", "collegeId name");

    res.json(records);

  } catch (err) {
    console.error("Get attendance by slot error:", err);
    res.status(500).json([]);
  }
};


/* ===============================
   MANUAL UPDATE
   =============================== */
export const updateManualAttendance = async (req, res) => {
  try {
    const { slotId, records } = req.body;
    const allowedStatuses = new Set(["P", "A"]);

    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({ message: "Valid slotId is required" });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "records must be a non-empty array" });
    }

    const invalidRecord = records.find(
      (r) =>
        !r?.recordId ||
        !mongoose.Types.ObjectId.isValid(r.recordId) ||
        !allowedStatuses.has(r.status)
    );

    if (invalidRecord) {
      return res.status(400).json({
        message: "Each record must include valid recordId and status (P/A)"
      });
    }

    const slot = await AttendanceSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Attendance slot not found" });
    }

    const cls = await ClassSession.findById(slot.classId).select("teacherId");
    if (!cls || String(cls.teacherId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not allowed to modify this slot" });
    }

    const recordIds = records.map((r) => r.recordId);
    const allowedCount = await AttendanceRecord.countDocuments({
      _id: { $in: recordIds },
      attendanceSlotId: slotId
    });

    if (allowedCount !== recordIds.length) {
      return res.status(400).json({
        message: "One or more records do not belong to this attendance slot"
      });
    }

    const bulkOps = records.map((r) => ({
      updateOne: {
        filter: { _id: r.recordId, attendanceSlotId: slotId },
        update: {
          status: r.status,
          method: "MANUAL"
        }
      }
    }));

    const result = await AttendanceRecord.bulkWrite(bulkOps);

    res.json({
      message: "Attendance updated successfully",
      modifiedCount: result.modifiedCount || 0
    });
  } catch (err) {
    console.error("Manual update error:", err);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};



export const getAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const minPercentage = Number(req.query.min) || 75;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const classObjectId = new mongoose.Types.ObjectId(classId);

    // total classes conducted
    const totalSlots = await AttendanceSlot.countDocuments({
      classId: classObjectId
    });

    if (totalSlots === 0) {
      return res.json({
        totalSlots: 0,
        students: [],
        defaulters: []
      });
    }

    // aggregate attendance
    const records = await AttendanceRecord.aggregate([
      {
        $lookup: {
          from: "attendanceslots",
          localField: "attendanceSlotId",
          foreignField: "_id",
          as: "slot"
        }
      },
      { $unwind: "$slot" },
      {
        $match: {
          "slot.classId": classObjectId
        }
      },
      {
        $group: {
          _id: "$studentId",
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
          }
        }
      }
    ]);

    const students = await Student.find({
      _id: { $in: records.map(r => r._id) }
    });

    const summary = students.map(stu => {
      const record = records.find(
        r => r._id.toString() === stu._id.toString()
      );

      const present = record ? record.presentCount : 0;
      const percentage = ((present / totalSlots) * 100).toFixed(2);

      return {
        studentId: stu._id,
        collegeId: stu.collegeId,
        name: stu.name,
        present,
        totalSlots,
        percentage: Number(percentage),
        isDefaulter: percentage < minPercentage
      };
    });

    return res.json({
      totalSlots,
      students: summary,
      defaulters: summary.filter(s => s.isDefaulter)
    });
  } catch (err) {
    console.error("Get attendance summary error:", err);
    return res.status(500).json({ message: "Failed to load summary" });
  }
};
