import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Student from "./models/Student.js";
import Teacher from "./models/Teacher.js";

const MONGO_URI = "mongodb+srv://siddhant:test123@experiment.yyakj2d.mongodb.net/?retryWrites=true&w=majority&appName=experiment";

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "attendance" });
    console.log("✅ MongoDB connected");

    // 🔥 Clean slate
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await User.deleteMany({});
    console.log("🗑 Old users, students & teachers deleted");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    let collegeCounter = 1;

    /* ======================
       🎓 CREATE STUDENT USERS
       ====================== */
    const studentUsersPayload = [];
    const studentMeta = [];

    for (let i = 1; i <= 70; i++) {
      const name = `Student ${i}`;
      const collegeId = 24105110000 + collegeCounter;

      studentUsersPayload.push({
        name,
        collegeId,
        password: hashedPassword,
        role: "STUDENT",
      });

      studentMeta.push({
        name,
        semester: i <= 35 ? 3 : 5,
      });

      collegeCounter++;
    }

    const createdStudentUsers = await User.insertMany(
      studentUsersPayload,
      { ordered: true }
    );

    /* ======================
       🎓 CREATE STUDENTS
       ====================== */
    const studentsPayload = createdStudentUsers.map((user, idx) => ({
      userId: user._id,
      collegeId: user.collegeId,
      name: studentMeta[idx].name,
      branch: "CSE",
      semester: studentMeta[idx].semester,
      section: idx < 35 ? "A" : "B",
      group: 1,
    }));

    await Student.insertMany(studentsPayload, { ordered: true });

    /* ======================
       👨‍🏫 CREATE TEACHER USERS
       ====================== */
    const teacherUsersPayload = [];
    const teacherMeta = [];

    for (let i = 1; i <= 20; i++) {
      const name = `Teacher ${i}`;
      const collegeId = `TCH${collegeCounter++}`;

      teacherUsersPayload.push({
        name,
        collegeId,
        password: hashedPassword,
        role: "TEACHER",
      });

      teacherMeta.push({
        name,
        collegeId,
        designation: "Assistant Professor",
      });
    }

    const createdTeacherUsers = await User.insertMany(
      teacherUsersPayload,
      { ordered: true }
    );

    /* ======================
       👨‍🏫 CREATE TEACHERS
       ====================== */
    const teachersPayload = createdTeacherUsers.map((user, idx) => ({
      userId: user._id,
      collegeId: teacherMeta[idx].collegeId,
      name: teacherMeta[idx].name,
      designation: teacherMeta[idx].designation,
    }));

    await Teacher.insertMany(teachersPayload, { ordered: true });

    /* ======================
       🧑‍💼 CREATE HOD USERS
       ====================== */
    const hodsPayload = [];

    for (let i = 1; i <= 10; i++) {
      hodsPayload.push({
        name: `HOD ${i}`,
        collegeId: `HOD${collegeCounter++}`,
        password: hashedPassword,
        role: "HOD",
      });
    }

    await User.insertMany(hodsPayload, { ordered: true });

    console.log("🎉 SEEDING SUCCESSFUL");
    console.log("👥 Users:", 70 + 20 + 10);
    console.log("🎓 Students: 70");
    console.log("👨‍🏫 Teachers: 20");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedUsers();
