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

/* 🔐 All routes protected */
router.use(protect);

/* HOD PROFILE */
router.get("/me", allowRoles("HOD"), getHodProfile);
router.get("/profile", allowRoles("HOD"), getHodProfile);

router.put(
  "/change-password",
  allowRoles("HOD"),
  changeHodPassword
);


/* SUBJECTS WITH TEACHERS */
router.get("/subjects", allowRoles("HOD"), getHodSubjects);

/* SUBJECT ATTENDANCE */
router.get(
  "/subject/:subjectId/attendance",
  allowRoles("HOD"),
  getSubjectAttendance
);

export default router;


