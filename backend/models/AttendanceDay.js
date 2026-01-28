import mongoose from "mongoose";

const attendanceDaySchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

/* One attendance per class per date */
attendanceDaySchema.index({ classId: 1, date: 1 }, { unique: true });

export default mongoose.models.AttendanceDay ||
  mongoose.model("AttendanceDay", attendanceDaySchema);
