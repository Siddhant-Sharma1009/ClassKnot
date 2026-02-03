import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    attendanceSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSlot",
      required: true
    },

    // ✅ USER ID (NOT STUDENT ID)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["P", "A"],
      default: "A"
    },

    method: {
      type: String,
      enum: ["MANUAL", "QR"],
      default: "MANUAL"
    }
  },
  { timestamps: true }
);

attendanceRecordSchema.index(
  { attendanceSlotId: 1, studentId: 1 },
  { unique: true }
);


const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", attendanceRecordSchema);

export default AttendanceRecord;
