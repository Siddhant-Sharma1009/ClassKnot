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

    const slots = await AttendanceSlot.find({ classId })
      .sort({ date: -1, createdAt: -1 });

    res.json(slots);
  } catch (err) {
    console.error("Get attendance slots error:", err);
    res.status(500).json([]);
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
    const { records } = req.body;

    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { _id: r.recordId },
        update: {
          status: r.status,
          method: "MANUAL"
        }
      }
    }));

    await AttendanceRecord.bulkWrite(bulkOps);

    res.json({ message: "Attendance updated successfully" });
  } catch (err) {
    console.error("Manual update error:", err);
    res.status(500).json({ message: "Failed to update attendance" });
  }
};



export const getAttendanceSummary = async (req, res) => {
  const { classId } = req.params;
  const minPercentage = Number(req.query.min) || 75;

  // total classes conducted
  const totalSlots = await AttendanceSlot.countDocuments({
    classId
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
        "slot.classId": classId
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

  res.json({
    totalSlots,
    students: summary,
    defaulters: summary.filter(s => s.isDefaulter)
  });
};
