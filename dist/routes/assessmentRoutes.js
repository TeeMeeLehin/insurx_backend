"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const assessmentController_1 = require("../controllers/assessmentController");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.protect, assessmentController_1.createAssessment);
router.get("/", authMiddleware_1.protect, assessmentController_1.getAssessments);
exports.default = router;
