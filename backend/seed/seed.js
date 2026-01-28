import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";

await mongoose.connect(process.env.MONGO_URI);

console.log("🔄 Syncing students from users");

// ==========================
// CONFIG (CHANGE IF YOU WANT)
// ==========================
const DEFAULT_BRANCH = "CSE";
const DEFAULT_SEMESTER = 3;
const DEFAULT_SECTIONS = ["A", "B"];
const DEFAULT_GROUPS = ["1", "2", "3"];

// ==========================
// FETCH ALL STUDENT USERS
// ==========================
const studentUsers = await User.find({ role: "STUDENT" });

let created = 0;
let skipped = 0;

for (let i = 0; i < studentUsers.length; i++) {
  const user = studentUsers[i];

  const exists = await Student.findOne({ userId: user._id });

  if (exists) {
    skipped++;
    continue;
  }

  await Student.create({
    userId: user._id,
    collegeId: user.collegeId,              // ✅ REQUIRED
    name: user.collegeId,                   // placeholder
    branch: DEFAULT_BRANCH,                 // ✅ REQUIRED
    semester: DEFAULT_SEMESTER,             // ✅ REQUIRED
    section: DEFAULT_SECTIONS[i % DEFAULT_SECTIONS.length],
    group: DEFAULT_GROUPS[i % DEFAULT_GROUPS.length]
  });

  created++;
}

console.log(`✅ Students created: ${created}`);
console.log(`⏭️ Students skipped (already existed): ${skipped}`);
console.log("🎉 Student collection is now fully synced");

process.exit();
