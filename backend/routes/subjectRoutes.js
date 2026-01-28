import express from "express";
import Subject from "../models/Subject.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET subjects by branch & semester
 */
router.get("/", protect, async (req, res) => {
  try {
    let { branch, semester } = req.query;

    if (!branch || !semester) {
      return res.json([]);
    }

    branch = branch.toUpperCase();
    semester = Number(semester);

    const subjects = await Subject.find({ branch, semester });

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

export default router;
