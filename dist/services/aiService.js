"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("../config/env");
// Using Gemini 3 Flash for better performance in 2026
const MODEL_NAME = "gemini-3-flash-preview";
// Initialize the client
const ai = new genai_1.GoogleGenAI({ apiKey: env_1.config.GEMINI_API_KEY });
exports.aiService = {
    async generateRiskAnalysis(areaName, weatherContext) {
        try {
            const prompt = `Act as an expert insurance risk analyst. Analyze: "${areaName}".
            Context: Temp ${weatherContext.temperature}, Wind ${weatherContext.windSpeed}, Condition ${weatherContext.status}.
            Provide a 3-sentence summary of climate risk.`;
            // NEW SYNTAX: Direct call to ai.models.generateContent
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            return response.text?.() || "Analysis currently unavailable.";
        }
        catch (error) {
            console.error("AI Service Error:", error);
            return "Analysis currently unavailable.";
        }
    },
    async analyzeHazardRisks(location) {
        try {
            const prompt = `Analyze risk levels (0.0 to 1.0) for: "${location}".
            Return ONLY JSON: {"flood": 0, "storm": 0, "rainfall": 0, "heatwave": 0, "drought": 0, "wind": 0}`;
            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    // This forces the model to return valid JSON without markdown tags
                    responseMimeType: "application/json"
                }
            });
            const text = response.text?.();
            if (!text) {
                throw new Error("Empty response from AI");
            }
            return JSON.parse(text);
        }
        catch (error) {
            console.error("Hazard Analysis Error:", error);
            return { flood: 0.3, storm: 0.2, rainfall: 0.2, heatwave: 0.2, drought: 0.1, wind: 0.1 };
        }
    }
};
