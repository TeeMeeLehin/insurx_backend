"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const monitoringController_1 = require("../controllers/monitoringController");
const router = express_1.default.Router();
// Save setup (Protected) - "Monitoring" endpoint
router.post("/config", authMiddleware_1.protect, monitoringController_1.saveMonitoringArea);
// Get dashboard (Protected) - Replaces /status
router.get("/dashboard", authMiddleware_1.protect, monitoringController_1.getDashboard);
exports.default = router;
