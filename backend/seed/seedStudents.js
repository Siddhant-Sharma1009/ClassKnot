import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";

const MONGO_URI = "mongodb+srv://siddhant:test123@experiment.yyakj2d.mongodb.net/?retryWrites=true&w=majority&appName=experiment";

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI,{dbName: "attendance"});
    console.log("✅ MongoDB connected");

    // 🔥 Clean slate
    await Student.deleteMany({});
    await User.deleteMany({});
    console.log("🗑 Old users & students deleted");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    let collegeCounter = 1;

    // ======================
    // 🎓 CREATE STUDENT USERS
    // ======================
    const studentUsersPayload = [];
    const studentMeta = []; // store name + index safely

    for (let i = 1; i <= 70; i++) {
      const name = `Student ${i}`;
      const collegeId = 24105110000 + collegeCounter;

      studentUsersPayload.push({
        name,
        collegeId,
        password: hashedPassword,
        role: "STUDENT"
      });

      studentMeta.push({
        name,
        semester: i <= 35 ? 3 : 5
      });

      collegeCounter++;
    }

    const createdUsers = await User.insertMany(studentUsersPayload, {
      ordered: true
    });

    // ======================
    // 🎓 CREATE STUDENTS (NO DEPENDENCY BUG)
    // ======================
    const studentsPayload = createdUsers.map((user, idx) => ({
      userId: user._id,   
      collegeId:user.collegeId,               // ✅ required
      name: studentMeta[idx].name,       // ✅ explicitly set
      branch: "CSE",                     // ✅ required
      semester: studentMeta[idx].semester,
      section: idx < 35 ? "A" : "B",
      group:1
    }));

    await Student.insertMany(studentsPayload, {
      ordered: true
    });

    // ======================
    // 👨‍🏫 TEACHERS (20)
    // ======================
    const teachers = [];
    for (let i = 1; i <= 20; i++) {
      teachers.push({
        name: `Teacher ${i}`,
        collegeId: `TCH${collegeCounter++}`,
        password: hashedPassword,
        role: "TEACHER",
        department: "CSE"
      });
    }
    await User.insertMany(teachers);

    // ======================
    // 🧑‍💼 HODs (10)
    // ======================
    const hods = [];
    for (let i = 1; i <= 10; i++) {
      hods.push({
        name: `HOD ${i}`,
        collegeId: `HOD${collegeCounter++}`,
        password: hashedPassword,
        role: "HOD",
        department: "CSE"
      });
    }
    await User.insertMany(hods);

    console.log("🎉 SEEDING SUCCESSFUL");
    console.log("👥 Users: 100");
    console.log("🎓 Students: 70");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedUsers();
