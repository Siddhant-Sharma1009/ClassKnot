import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* =============================
   GET MY PROFILE
   ============================= */
export const getMyProfile = async (req, res) => {
  try {
    // ?? Inspect what protect middleware provides
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ? IMPORTANT FIX: find by userId, not _id
    const teacher = await Teacher.findOne({ userId }).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      designation: teacher.designation,
      collegeId: teacher.collegeId,
      role: "TEACHER",
      subjects: teacher.subjects || [],
      email: teacher.email,
    });
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =============================
   UPDATE MY PROFILE
   ============================= */
export const updateMyProfile = async (req, res) => {
  return res.status(403).json({
    message: "Profile details are read-only. Only password change is allowed."
  });
};

/* =============================
   CHANGE MY PASSWORD
   ============================= */
export const changeMyPassword = async (req, res) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required"
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters"
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "TEACHER") {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("changeMyPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
