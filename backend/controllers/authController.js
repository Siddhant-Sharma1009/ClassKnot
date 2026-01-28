import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
  
  const { collegeId, password } = req.body;

  const user = await User.findOne({ collegeId });
  if (!user) return res.status(401).json({ message: "Invalid ID" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      collegeId: user.collegeId
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }   // ✅ FIX
  );

  res.json({ token, role: user.role });
};
