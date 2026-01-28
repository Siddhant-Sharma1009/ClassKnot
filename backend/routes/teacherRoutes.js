import express from "express";
import {
  getMyProfile,
  updateMyProfile
} from "../controllers/teacherController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/me", protect, allowRoles("TEACHER"), getMyProfile);
router.put("/me", protect, allowRoles("TEACHER"), updateMyProfile);

export default router;
