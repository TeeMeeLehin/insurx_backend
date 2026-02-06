"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const predictionController_1 = require("../controllers/predictionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Assuming this is for insurance companies (admins/business), might need stricter role check
router.post("/", authMiddleware_1.protect, predictionController_1.predictDisaster);
exports.default = router;
