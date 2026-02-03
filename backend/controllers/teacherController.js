import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";

/* =============================
   GET MY PROFILE
   ============================= */
export const getMyProfile = async (req, res) => {
  try {
    // 🔍 Inspect what protect middleware provides
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    
    const teacher = await Teacher.findOne({ userId }).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      designation: teacher.designation,
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
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, designation, subjects, password } = req.body;

    
    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    if (name !== undefined) teacher.name = name;
    if (designation !== undefined) teacher.designation = designation;
    if (subjects !== undefined) teacher.subjects = subjects;

    if (password && password.trim().length >= 6) {
      teacher.password = await bcrypt.hash(password, 10);
    }

    await teacher.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
