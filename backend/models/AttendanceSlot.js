import mongoose from "mongoose";

const attendanceSlotSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    /* When attendance starts */
    startTime: {
      type: Date,   // ⬅️ CHANGE (important)
      required: true
    },

    /* When attendance closes (QR expiry) */
    endTime: {
      type: Date,
      required: true
    },

    /* Controls QR validity */
    isActive: {
      type: Boolean,
      default: true
    },

    /* Optional label: Period 1 / Lab */
    slotLabel: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

/* One slot per class per date per startTime */
attendanceSlotSchema.index(
  { classId: 1, date: 1, startTime: 1 },
  { unique: true }
);

const AttendanceSlot =
  mongoose.models.AttendanceSlot ||
  mongoose.model("AttendanceSlot", attendanceSlotSchema);

export default AttendanceSlot;
