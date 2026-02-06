"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentController_1 = require("../controllers/paymentController");
const router = express_1.default.Router();
router.post("/initiate", authMiddleware_1.protect, paymentController_1.initiatePayment);
router.get("/verify/:reference", authMiddleware_1.protect, paymentController_1.verifyPayment);
exports.default = router;
