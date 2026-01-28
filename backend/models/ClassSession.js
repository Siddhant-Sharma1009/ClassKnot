import mongoose from "mongoose";

const classSessionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    subjectCode: { type: String, required: true },
    section: { type: String, default: null },
    group: { type: String, default: null },
    qrToken: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("ClassSession", classSessionSchema);
