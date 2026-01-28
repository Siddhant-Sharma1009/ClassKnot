import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session", // created by teacher
      required: true
    },
    row:{
      type: Number, required: true 
    }
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
