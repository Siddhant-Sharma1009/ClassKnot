import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSlot from "../models/AttendanceSlot.js";
import ClassSession from "../models/ClassSession.js";
import Student from "../models/Student.js";

dotenv.config();

const getArgValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) return fallback;
  return match.slice(prefix.length);
};

const toDateKey = (date) => {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const midnightUtc = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

const addDaysUtc = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const seededRandom = (seed) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const calcPresentRatio = (records) => {
  if (!records.length) return 0.82;
  let present = 0;
  for (const r of records) {
    if (r.status === "P") present += 1;
  }
  return Math.min(0.95, Math.max(0.55, present / records.length));
};

const run = async () => {
  const daysPerClass = Math.max(1, Number(getArgValue("days", 10)) || 10);
  const dryRun = process.argv.includes("--dry-run");

  await connectDB();

  const classes = await ClassSession.find({}).select(
    "_id branch semester section group subjectCode subjectName"
  );

  if (!classes.length) {
    console.log("No classes found. Nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  let totalSlotsCreated = 0;
  let totalRecordsCreated = 0;

  for (const cls of classes) {
    const filter = { branch: cls.branch, semester: cls.semester };
    if (cls.section) filter.section = cls.section;
    if (cls.group) filter.group = cls.group;

    const students = await Student.find(filter).select("_id");
    if (!students.length) {
      console.log(`Skipping class ${cls._id}: no matching students.`);
      continue;
    }

    const existingSlots = await AttendanceSlot.find({ classId: cls._id })
      .sort({ date: -1, startTime: -1 })
      .select("_id date startTime endTime");

    const existingSlotIds = existingSlots.map((s) => s._id);
    const existingRecords = existingSlotIds.length
      ? await AttendanceRecord.find({ attendanceSlotId: { $in: existingSlotIds } }).select("status")
      : [];
    const presentRatio = calcPresentRatio(existingRecords);

    const existingDateKeys = new Set(existingSlots.map((s) => toDateKey(s.date)));
    const latestDate = existingSlots.length ? midnightUtc(existingSlots[0].date) : midnightUtc(new Date());

    let templateStartHour = 9;
    let templateStartMinute = 0;
    let templateDurationMinutes = 10;
    if (existingSlots.length) {
      const refStart = new Date(existingSlots[0].startTime);
      const refEnd = new Date(existingSlots[0].endTime);
      templateStartHour = refStart.getUTCHours();
      templateStartMinute = refStart.getUTCMinutes();
      const diffMin = Math.round((refEnd.getTime() - refStart.getTime()) / 60000);
      if (diffMin > 0 && diffMin <= 180) templateDurationMinutes = diffMin;
    }

    let cursor = latestDate;
    let createdForClass = 0;

    while (createdForClass < daysPerClass) {
      cursor = addDaysUtc(cursor, -1);
      const key = toDateKey(cursor);
      if (existingDateKeys.has(key)) continue;

      const startTime = new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
          templateStartHour,
          templateStartMinute,
          0,
          0
        )
      );
      const endTime = new Date(startTime.getTime() + templateDurationMinutes * 60 * 1000);

      if (dryRun) {
        createdForClass += 1;
        existingDateKeys.add(key);
        totalSlotsCreated += 1;
        totalRecordsCreated += students.length;
        continue;
      }

      const slot = await AttendanceSlot.create({
        classId: cls._id,
        date: midnightUtc(cursor),
        startTime,
        endTime,
        isActive: false,
        slotLabel: "Backfilled"
      });

      const records = students.map((student, idx) => {
        const randomVal = seededRandom(
          Number(slot._id.toString().slice(-6), 16) + idx * 13 + createdForClass * 7
        );
        const isPresent = randomVal <= presentRatio;
        const method = isPresent && randomVal > 0.4 ? "QR" : "MANUAL";

        return {
          attendanceSlotId: slot._id,
          studentId: student._id,
          status: isPresent ? "P" : "A",
          method: isPresent ? method : "MANUAL"
        };
      });

      await AttendanceRecord.insertMany(records, { ordered: false });

      createdForClass += 1;
      existingDateKeys.add(key);
      totalSlotsCreated += 1;
      totalRecordsCreated += records.length;
    }

    console.log(
      `Class ${cls.subjectCode} (${cls.semester}${cls.section ? `-${cls.section}` : ""}) -> ${createdForClass} slots`
    );
  }

  console.log(
    `${dryRun ? "Dry-run completed" : "Backfill completed"}. Slots created: ${totalSlotsCreated}, records created: ${totalRecordsCreated}`
  );
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Backfill failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
