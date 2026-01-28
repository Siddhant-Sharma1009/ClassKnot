import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    collegeId: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["STUDENT", "TEACHER", "HOD"],
      required: true
    }
  }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);
