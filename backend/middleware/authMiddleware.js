import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: token missing"
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user from DB
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: user not found"
      });
    }

    // 🔥 THIS WAS MISSING / BROKEN EARLIER
    req.user = {
      userId: user._id,
      collegeId: user.collegeId,
      role: user.role
    };

    next(); // ✅ MUST be called
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({
      message: "Unauthorized: invalid token"
    });
  }
};
