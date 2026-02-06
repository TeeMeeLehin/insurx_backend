"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.saveMonitoringArea = void 0;
const db_1 = __importDefault(require("../config/db"));
const weatherService_1 = require("../services/weatherService");
const aiService_1 = require("../services/aiService");
// Save or Update Monitoring Area
const saveMonitoringArea = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { startArea, endArea } = req.body; // Removed notificationEmail
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!startArea || !endArea) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // 1. Geocode Start Area (for lat/lon if needed for dashboard later)
        const coords = await weatherService_1.weatherService.getCoordinates(startArea);
        // 2. Get AI Analysis (Graceful fallback built into service)
        const areaAiSummary = await aiService_1.aiService.generateAreaClimateAnalysis(startArea, endArea);
        console.log("Area AI Summary:", areaAiSummary);
        // 3. Upsert to DB
        const monitoringArea = await db_1.default.monitoringArea.upsert({
            where: { userId },
            update: {
                startArea,
                startLat: coords?.lat || null,
                startLon: coords?.lon || null,
                endArea,
                areaAiSummary
            },
            create: {
                userId,
                startArea,
                startLat: coords?.lat || null,
                startLon: coords?.lon || null,
                endArea,
                areaAiSummary
            }
        });
        res.status(200).json({
            message: "Monitoring area saved successfully",
            monitoringArea
        });
    }
    catch (error) {
        console.error("Error saving monitoring area:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.saveMonitoringArea = saveMonitoringArea;
// Get Dashboard Data (Live + Caching)
const getDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const monitoringArea = await db_1.default.monitoringArea.findUnique({
            where: { userId },
            include: { user: { select: { subscriptionStatus: true } } }
        });
        if (!monitoringArea) {
            res.status(404).json({ error: "No monitoring area set" });
            return;
        }
        let weather = null;
        let history = null;
        // Try to fetch Real Weather
        try {
            if (monitoringArea.startLat && monitoringArea.startLon) {
                weather = await weatherService_1.weatherService.getCurrentWeather(monitoringArea.startLat, monitoringArea.startLon);
                history = await weatherService_1.weatherService.getHistoricalContext(monitoringArea.startLat, monitoringArea.startLon);
            }
        }
        catch (err) {
            console.warn("Weather service failed, falling back to cache/mock.");
        }
        let climateData;
        if (weather) {
            // Live Data Success
            climateData = {
                status: weather.description,
                temperature: `${Math.round(weather.temp)}°C`,
                humidity: `${weather.humidity}%`,
                precipitation: `${weather.precipitation}mm`,
                windSpeed: `${weather.windSpeed} km/h`,
                aiAnalysis: monitoringArea.areaAiSummary
            };
            // Update Cache
            await db_1.default.monitoringArea.update({
                where: { userId },
                data: {
                    cachedWeatherData: JSON.stringify({ climateData, historicalData: history })
                }
            });
        }
        else {
            // Fallback: Cache or Mock
            if (monitoringArea.cachedWeatherData) {
                console.log("Serving cached dashboard data for user", userId);
                const cached = JSON.parse(monitoringArea.cachedWeatherData);
                climateData = cached.climateData;
                history = cached.historicalData;
            }
            else {
                console.log("Serving mock dashboard data for user", userId);
                // Total fallback if no cache and no live data
                climateData = {
                    status: "Partly Cloudy",
                    temperature: "28°C",
                    humidity: "65%",
                    precipitation: "2mm",
                    windSpeed: "12 km/h",
                    aiAnalysis: monitoringArea.areaAiSummary || "AI Analysis pending... Climate stability moderate."
                };
                history = [
                    { date: "2026-02-01", temp: 28, risk: "Low" },
                    { date: "2026-02-02", temp: 29, risk: "Moderate" },
                    { date: "2026-02-03", temp: 27, risk: "Low" }
                ];
            }
        }
        res.status(200).json({
            monitoringArea,
            climateData,
            historicalData: history || []
        });
    }
    catch (error) {
        console.error("Error getting dashboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getDashboard = getDashboard;
