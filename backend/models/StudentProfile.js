import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String },
  group: { type: String }
});

export default mongoose.model("StudentProfile", studentProfileSchema);
