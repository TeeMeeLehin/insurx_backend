"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssessments = exports.createAssessment = void 0;
const db_1 = __importDefault(require("../config/db"));
const aiService_1 = require("../services/aiService");
// Formula Constants
const HAZARD_WEIGHTS = {
    flood: 0.30,
    storm: 0.25,
    rainfall: 0.15,
    heatwave: 0.10,
    drought: 0.10,
    wind: 0.10
};
const EXPOSURE_WEIGHTS = {
    propertyValue: 0.50,
    occupancy: 0.30,
    replacementCost: 0.20
};
const MAX_PROPERTY_VALUE_BASELINE = 1000000; // $1M as baseline for index 1.0
const createAssessment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { location, propertyValue } = req.body;
        console.log(`[Assessment] Request received for User: ${userId}, Location: ${location}, Value: ${propertyValue}`);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!location || !propertyValue) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // 1. Get Hazard Data from AI
        const hazardRisks = await aiService_1.aiService.analyzeHazardRisks(location);
        // 2. Calculate Hazard Score
        // hazard_score = 0.30 * flood + 0.25 * storm + ...
        const hazardScore = (HAZARD_WEIGHTS.flood * hazardRisks.flood) +
            (HAZARD_WEIGHTS.storm * hazardRisks.storm) +
            (HAZARD_WEIGHTS.rainfall * hazardRisks.rainfall) +
            (HAZARD_WEIGHTS.heatwave * hazardRisks.heatwave) +
            (HAZARD_WEIGHTS.drought * hazardRisks.drought) +
            (HAZARD_WEIGHTS.wind * hazardRisks.wind);
        // 3. Calculate Exposure Score
        // property_value_index = value / max_value (capped at 1.0 for sanity, or allowed to scale?)
        // Let's cap at 1.5 to penalize super high value but not break scale
        let propertyValueIndex = propertyValue / MAX_PROPERTY_VALUE_BASELINE;
        if (propertyValueIndex > 1.5)
            propertyValueIndex = 1.5;
        // occupancy_risk (Default 0.5 for now as we don't ask user)
        const occupancyRisk = 0.5;
        // replacement_cost_index (Estimate 80% of value)
        let replacementCostIndex = (propertyValue * 0.8) / MAX_PROPERTY_VALUE_BASELINE;
        if (replacementCostIndex > 1.5)
            replacementCostIndex = 1.5;
        const exposureScore = (EXPOSURE_WEIGHTS.propertyValue * propertyValueIndex) +
            (EXPOSURE_WEIGHTS.occupancy * occupancyRisk) +
            (EXPOSURE_WEIGHTS.replacementCost * replacementCostIndex);
        // 4. Final Risk Score
        // final_risk_score = 0.70 * hazard_score + 0.30 * exposure_score
        const riskScore = (0.70 * hazardScore) + (0.30 * exposureScore);
        // 5. Generate AI Explanation
        // We can reuse the hazard analysis or ask for a summary. 
        // For efficiency, we'll construct a summary from the data or just use a standard template for now.
        const aiAnalysis = `Analysis complete for ${location}. Hazard Score: ${(hazardScore * 100).toFixed(0)}/100. Primary drivers: Flood (${hazardRisks.flood}), Storm (${hazardRisks.storm}). Exposure Score: ${(exposureScore * 100).toFixed(0)}/100.`;
        // 6. Save to DB
        const assessment = await db_1.default.assessment.create({
            data: {
                userId,
                location,
                propertyValue: parseFloat(propertyValue),
                riskScore: parseFloat(riskScore.toFixed(2)),
                hazardScore: parseFloat(hazardScore.toFixed(2)),
                exposureScore: parseFloat(exposureScore.toFixed(2)),
                aiAnalysis
            }
        });
        res.status(201).json({
            assessment,
            hazardRisks // Return breakdown for UI
        });
    }
    catch (error) {
        console.error("Assessment Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.createAssessment = createAssessment;
const getAssessments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const assessments = await db_1.default.assessment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(assessments);
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAssessments = getAssessments;
