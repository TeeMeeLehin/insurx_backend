import express from "express";
import { protect } from "../middleware/authMiddleware";
import { initiatePayment, verifyPayment } from "../controllers/paymentController";

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.get("/verify/:reference", protect, verifyPayment);

export default router;
