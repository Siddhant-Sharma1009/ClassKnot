import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    designation: {
      type: String,
      required: true
    },
    subjects: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    autoIndex: false   // 🔥 CRITICAL
  }
);

export default mongoose.models.Teacher ||
  mongoose.model("Teacher", teacherSchema);
