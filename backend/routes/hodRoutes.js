import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

import {
  getHodProfile,
  getHodSubjects,
  getSubjectAttendance,
  changeHodPassword
} from "../controllers/hodController.js";

const router = express.Router();

// 🔐 HOD protected route
router.get(
  "/me",
  protect,
  allowRoles("HOD"),
  (req, res) => {
    res.status(200).json({
      message: "HOD login successful",
      user: req.user
    });
  }
);


/* 🔐 All routes protected */
router.use(protect);

/* HOD PROFILE */
router.get("/profile", getHodProfile);

router.put(
  "/change-password",
  protect,
  allowRoles("HOD"),
  changeHodPassword
);


/* SUBJECTS WITH TEACHERS */
router.get("/subjects", getHodSubjects);

/* SUBJECT ATTENDANCE */
router.get("/subject/:subjectId/attendance", getSubjectAttendance);

export default router;


