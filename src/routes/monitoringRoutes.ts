import express from "express";
import { protect } from "../middleware/authMiddleware";
import { saveMonitoringArea, getDashboard } from "../controllers/monitoringController";

const router = express.Router();

// Save setup (Protected) - "Monitoring" endpoint
router.post("/config", protect, saveMonitoringArea);

// Get dashboard (Protected) - Replaces /status
router.get("/dashboard", protect, getDashboard);

export default router;
