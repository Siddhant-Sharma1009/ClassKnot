import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

dotenv.config();

const run = async () => {
  try {
    // 🔑 CONNECT TO DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // 🔄 CLEAN OLD PROFILES
    await StudentProfile.deleteMany();

    // 🎯 FIND STUDENT USERS
    const students = await User.find({ role: "STUDENT" });

    if (students.length === 0) {
      console.log("⚠️ No student users found");
      process.exit();
    }

    // 🌱 CREATE PROFILES
    for (const user of students) {
      await StudentProfile.create({
        userId: user._id,
        branch: "CSE",
        semester: 3,
        section: "A",
        group: "1"
      });
    }

    console.log("✅ Student profiles seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

run();
