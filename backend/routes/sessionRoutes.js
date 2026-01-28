import express from "express";
import { createSession, getMyClasses } from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Create new class
 */
router.post(
  "/create",
  protect,
  allowRoles("TEACHER"),
  createSession
);

/**
 * Get my classes (Teacher dashboard)
 */
router.get(
  "/my-classes",
  protect,
  allowRoles("TEACHER"),
  getMyClasses
);

export default router;
