import express from "express";
import {
  getMyProfile,
  getMyClasses,
  getMyAttendance,
  getMyAttendanceSummary,
  getMySubjects,
  getSubjectAttendance,
  changeStudentPassword
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";


const router = express.Router();

/* PROFILE */
router.get(
  "/me",
  protect,
  allowRoles("STUDENT"),
  getMyProfile
);

/* MY CLASSES */
router.get(
  "/classes",
  protect,
  allowRoles("STUDENT"),
  getMyClasses
);

router.get(
  "/attendance",
  protect,
  allowRoles("STUDENT"),
  getMyAttendanceSummary
);

/* MY ATTENDANCE */
router.get(
  "/attendance/:classId",
  protect,
  allowRoles("STUDENT"),
  getMyAttendance
);



/* MY SUBJECTS */
router.get(
  "/subjects",
  protect,
  allowRoles("STUDENT"),
  getMySubjects
);

/* SUBJECT ATTENDANCE */
router.get(
  "/subject/:subjectCode/attendance",
  protect,
  allowRoles("STUDENT"),
  getSubjectAttendance
);

router.put(
  "/change-password",
  protect,
  allowRoles("STUDENT"),
  changeStudentPassword
);

export default router;
