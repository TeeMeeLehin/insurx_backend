"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictDisaster = void 0;
const zod_1 = require("zod");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const predictionSchema = zod_1.z.object({
    region: zod_1.z.string(),
    timeframe: zod_1.z.enum(["week", "month", "year"]),
});
const predictDisaster = async (req, res, next) => {
    try {
        const { region, timeframe } = predictionSchema.parse(req.body);
        // Mock Prediction Logic for Insurance Companies
        // Using "historical and live data" (mocked)
        const predictions = {
            region,
            timeframe,
            probabilityOfFlood: Math.random() * 100,
            probabilityOfFire: Math.random() * 100,
            alertLevel: Math.random() > 0.5 ? "HIGH" : "NORMAL",
            recommendation: "Ensure updated policies for flood coverage in this region.",
        };
        res.json({
            message: "Disaster prediction analysis",
            data: predictions,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return next(new errorMiddleware_1.AppError(error.errors[0].message, 400));
        }
        next(error);
    }
};
exports.predictDisaster = predictDisaster;
