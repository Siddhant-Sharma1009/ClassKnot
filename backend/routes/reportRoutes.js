import express from "express";
import {
  studentReport,
  sessionReport,
  hodReport
} from "../controllers/reportController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/student",
  protect,
  allowRoles("STUDENT"),
  studentReport
);

router.get(
  "/session/:sessionId",
  protect,
  allowRoles("TEACHER"),
  sessionReport
);

router.get(
  "/hod",
  protect,
  allowRoles("HOD"),
  hodReport
);

export default router;
