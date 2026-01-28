import mongoose from "mongoose";
import dotenv from "dotenv";

import Student from "../models/Student.js";
import ClassSession from "../models/ClassSession.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import AttendanceRecord from "../models/AttendanceRecord.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const seedAttendance = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Clear only attendance data
    await AttendanceRecord.deleteMany({});
    await AttendanceSlot.deleteMany({});
    console.log("🗑 Old attendance cleared");

    const students = await Student.find({});
    const classes = await ClassSession.find({});

    if (!students.length) {
      throw new Error("No students found");
    }
    if (!classes.length) {
      throw new Error("No classes found");
    }

    const records = [];

    for (const cls of classes) {
      // 🔁 Create 10 lectures per class
      for (let i = 1; i <= 10; i++) {
        const lectureDate = new Date(2025, 0, i);

        const slot = await AttendanceSlot.create({
          classId: cls._id,
          subject: cls.subject,
          date: lectureDate,

          // ✅ REQUIRED FIELD (FIX)
          startTime: new Date(
            lectureDate.getFullYear(),
            lectureDate.getMonth(),
            lectureDate.getDate(),
            10, // 10:00 AM
            0
          )
        });

        // Create attendance records for students
        for (const student of students) {
          records.push({
            attendanceSlotId: slot._id,
            studentId: student._id,
            status: Math.random() > 0.25 ? "P" : "A"
          });
        }
      }
    }

    await AttendanceRecord.insertMany(records);

    console.log("🎉 Attendance seeded correctly");
    console.log("Students:", students.length);
    console.log("Classes:", classes.length);
    console.log("Records:", records.length);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    process.exit(1);
  }
};

seedAttendance();
