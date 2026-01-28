import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";

export const getMyProfile = async (req, res) => {
  const teacher = await Teacher.findById(req.user.userId).select("-password");
  res.json(teacher);
};

export const updateMyProfile = async (req, res) => {
  const { name, designation, subjects, password } = req.body;

  const teacher = await Teacher.findById(req.user.userId);

  if (name) teacher.name = name;
  if (designation) teacher.designation = designation;
  if (subjects) teacher.subjects = subjects;

  if (password && password.trim().length >= 6) {
    teacher.password = await bcrypt.hash(password, 10);
  }

  await teacher.save();
  res.json({ message: "Profile updated successfully" });
};
