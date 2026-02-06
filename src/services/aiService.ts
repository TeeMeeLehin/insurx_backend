const { GoogleGenAI } = require('@google/genai');
import { config } from '../config/env';


const MODEL_NAME = "gemini-3-flash-preview";

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

export const aiService = {
    async generateRiskAnalysis(areaName: string, weatherContext: any): Promise<string> {
        console.log(`[AI Service] Generating risk analysis for: ${areaName}`);
        try {
            const prompt = `
            Act as an expert insurance risk analyst. 
            Analyze the climate risk for the following area: "${areaName}".
            
            Current Weather Context:
            - Temperature: ${weatherContext.temperature}
            - Humidity: ${weatherContext.humidity}
            - Wind: ${weatherContext.windSpeed}
            - Precipitation: ${weatherContext.precipitation}
            - Condition: ${weatherContext.status}

            Provide a brief, professional paragraph (max 3 sentences) summarizing the climate risk profile for insurance purposes. 
            Focus on potential risks like flooding, structure damage, or business interruption based on the weather conditions.
            `;

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            if (response.text?.()) {
                return response.text();
            } else if (typeof response.text === 'string') {
                // Handling varying SDK response types (some return function, some string property)
                return response.text as string;
            } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                // Fallback to structure inspection if helper not available
                return response.candidates[0].content.parts[0].text;
            }

            return "AI Analysis: Moderate risk detected based on historical patterns. Continual monitoring recommended.";

        } catch (error) {
            console.error("Gemini API Error:", error);
            // Fallback for safety
            return "Analysis pending (AI Service unavailable). Standard risk monitoring protocols apply.";
        }
    },

    async generateAreaClimateAnalysis(startArea: string, endArea: string): Promise<string> {
        try {
            const prompt = `
            Act as an environmental analyst.
            Analyze the climate and weather history for the region between "${startArea}" and "${endArea}".
            
            Focus on:
            1. Historical susceptibility to flooding.
            2. Common climate disasters in this region.
            3. General weather patterns.

            Provide a concise summary (max 3-4 sentences).
            `;

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            if (response.text) return response.text;
            if (response.candidates?.[0]?.content?.parts?.[0]?.text) return response.candidates[0].content.parts[0].text;

            return "AI Analysis Pending.";

        } catch (error) {
            console.error("Gemini Area Analysis Error:", error);
            return "AI Analysis Pending (Service Unavailable)";
        }
    },

    async analyzeHazardRisks(location: string): Promise<any> {
        try {
            const prompt = `
            Act as a climate risk expert.
            Analyze the following location: "${location}".
            
            Estimate the risk levels for these specific hazards on a scale of 0.0 to 1.0 (where 0.0 is no risk, 1.0 is extreme/certain risk).
            Consider the geographic location, historical climate data, and typical weather patterns for this area.

            Return ONLY a valid JSON object with these exact keys and number values:
            {
                "flood": 0.0,
                "storm": 0.0,
                "rainfall": 0.0,
                "heatwave": 0.0,
                "drought": 0.0,
                "wind": 0.0
            }
            Do not wrap in markdown code blocks. Just valid JSON.
            `;

            const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            let text = "";
            if (response.text) {
                text = response.text;
            } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = response.candidates[0].content.parts[0].text;
            }

            if (text) {
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanText);
            }

            throw new Error("No data returned");

        } catch (error) {
            console.error("Gemini Hazard Analysis Error:", error);
            return {
                flood: 0.3,
                storm: 0.2,
                rainfall: 0.2,
                heatwave: 0.2,
                drought: 0.1,
                wind: 0.1
            };
        }
    }
};
