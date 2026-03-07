import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword
} from "../controllers/teacherController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/me", protect, allowRoles("TEACHER"), getMyProfile);
router.put("/me", protect, allowRoles("TEACHER"), updateMyProfile);
router.put("/change-password", protect, allowRoles("TEACHER"), changeMyPassword);

export default router;
