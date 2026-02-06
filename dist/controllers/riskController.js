"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessRisk = void 0;
const db_1 = __importDefault(require("../config/db"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const zod_1 = require("zod");
const riskAssessmentSchema = zod_1.z.object({
    location: zod_1.z.string(),
    assetValue: zod_1.z.number().positive(),
    propertyType: zod_1.z.string(),
    // Add other risk factors
});
const assessRisk = async (req, res, next) => {
    try {
        const data = riskAssessmentSchema.parse(req.body);
        const user = req.user;
        // Mock Risk Calculation Algorithm
        // In a real system, this would use historical data, location APIs, etc.
        let riskScore = 0;
        if (data.location.toLowerCase().includes("coastal"))
            riskScore += 50;
        if (data.propertyType === "wood")
            riskScore += 20;
        const finalScore = Math.min(Math.max(riskScore, 0), 100);
        const analysis = finalScore > 50 ? "High Risk" : "Low to Moderate Risk";
        const assessment = await db_1.default.riskAssessment.create({
            data: {
                userId: user.id,
                inputData: JSON.stringify(data),
                riskScore: finalScore,
                analysis,
            },
        });
        res.json({
            message: "Risk assessment completed",
            data: assessment,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return next(new errorMiddleware_1.AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};
exports.assessRisk = assessRisk;
