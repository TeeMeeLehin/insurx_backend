import { Request, Response } from 'express';
import prisma from '../config/db';
import { aiService } from '../services/aiService';

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

export const createAssessment = async (req: Request, res: Response): Promise<void> => {
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
        const hazardRisks = await aiService.analyzeHazardRisks(location);

        // 2. Calculate Hazard Score (Scaled 0-100)
        // hazard_score = (0.30 * flood + 0.25 * storm + ...) * 100
        const hazardScore = (
            (HAZARD_WEIGHTS.flood * hazardRisks.flood) +
            (HAZARD_WEIGHTS.storm * hazardRisks.storm) +
            (HAZARD_WEIGHTS.rainfall * hazardRisks.rainfall) +
            (HAZARD_WEIGHTS.heatwave * hazardRisks.heatwave) +
            (HAZARD_WEIGHTS.drought * hazardRisks.drought) +
            (HAZARD_WEIGHTS.wind * hazardRisks.wind)
        ) * 100;

        // 3. Calculate Exposure Score (Scaled 0-100)
        // Baseline: $1,000,000 represents "Little Exposure" (Score ~10).
        // Scaling: Linearly increases. $10M = 100.

        let propertyValueScale = (propertyValue / MAX_PROPERTY_VALUE_BASELINE) * 10;
        propertyValueScale = Math.min(100, Math.max(0, propertyValueScale)); // Clamp 0-100

        // occupancy_risk (static 0.5 -> 50 on 0-100 scale)
        const occupancyRiskScale = 50;

        // replacement_cost_index (80% of value, same scaling logic)
        let replacementCostScale = ((propertyValue * 0.8) / MAX_PROPERTY_VALUE_BASELINE) * 10;
        replacementCostScale = Math.min(100, Math.max(0, replacementCostScale));

        const exposureScore =
            (EXPOSURE_WEIGHTS.propertyValue * propertyValueScale) +
            (EXPOSURE_WEIGHTS.occupancy * occupancyRiskScale) +
            (EXPOSURE_WEIGHTS.replacementCost * replacementCostScale);


        // 4. Final Risk Score
        // final_risk_score = 0.70 * hazard_score + 0.30 * exposure_score
        const riskScore = (0.70 * hazardScore) + (0.30 * exposureScore);

        // 5. Generate AI Explanation
        // Scores are already 0-100, so we use them directly.
        const aiAnalysis = `Analysis complete for ${location}. Hazard Score: ${hazardScore.toFixed(0)}/100. Primary drivers: Flood (${hazardRisks.flood}), Storm (${hazardRisks.storm}). Exposure Score: ${exposureScore.toFixed(0)}/100.`;

        // 6. Save to DB
        const assessment = await prisma.assessment.create({
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

    } catch (error) {
        console.error("Assessment Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAssessments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const assessments = await prisma.assessment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
