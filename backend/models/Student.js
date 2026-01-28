import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    collegeId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    section: {
      type: String
    },
    group: {
      type: String
    }
  },
  {
    autoIndex: false   // 🔥 CRITICAL
  }
);

export default mongoose.models.Student ||
  mongoose.model("Student", studentSchema);
