import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: user not found"
      });
    }

    req.user = {
      userId: user._id,
      collegeId: user.collegeId,
      role: user.role
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({
      message: "Unauthorized: invalid token"
    });
  }
};
