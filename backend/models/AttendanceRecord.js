import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    attendanceSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSlot",
      required: true
    },

    // ✅ STUDENT is the attendance entity
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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

/* ✅ ONE RECORD PER STUDENT PER SLOT */
attendanceRecordSchema.index(
  { attendanceSlotId: 1, studentId: 1 },
  { unique: true }
);

const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", attendanceRecordSchema);

export default AttendanceRecord;
