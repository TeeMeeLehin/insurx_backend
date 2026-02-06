import express from "express";
import { protect } from "../middleware/authMiddleware";
import { createAssessment, getAssessments } from "../controllers/assessmentController";

const router = express.Router();

router.post("/", protect, createAssessment);
router.get("/", protect, getAssessments);

export default router;
