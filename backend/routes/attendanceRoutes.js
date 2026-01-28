import express from "express";

import {
  createAttendanceSlot,
  getAttendanceSlots,
  getAttendanceBySlot,
  updateManualAttendance,
  getAttendanceSummary
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ======================================================
   CREATE ATTENDANCE SLOT (DATE + TIME)
   Example: Take attendance at 09:00–10:00
   POST /api/attendance/slot/:classId
   body: { slotTime: "09:00-10:00" }
====================================================== */
router.post(
  "/slot/:classId",
  protect,
  allowRoles("TEACHER"),
  createAttendanceSlot
);

/* ======================================================
   GET ALL ATTENDANCE SLOTS FOR A CLASS
   (History view: date + time)
   GET /api/attendance/slots/:classId
====================================================== */
router.get(
  "/slots/:classId",
  protect,
  allowRoles("TEACHER"),
  getAttendanceSlots
);

/* ======================================================
   GET ATTENDANCE RECORDS FOR A SLOT
   (Manual / QR attendance screen)
   GET /api/attendance/slot-records/:slotId
====================================================== */
router.get(
  "/slot-records/:slotId",
  protect,
  allowRoles("TEACHER"),
  getAttendanceBySlot
);

/* ======================================================
   UPDATE MANUAL ATTENDANCE
   POST /api/attendance/manual-update
   body: { records: [{ recordId, status }] }
====================================================== */
router.post(
  "/manual-update",
  protect,
  allowRoles("TEACHER"),
  updateManualAttendance
);

router.get(
  "/summary/:classId",
  protect,
  allowRoles("TEACHER", "HOD"),
  getAttendanceSummary
);


export default router;
