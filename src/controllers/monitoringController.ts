import { Request, Response } from 'express';
import prisma from '../config/db';
import { weatherService } from '../services/weatherService';
import { aiService } from '../services/aiService';

// Save or Update Monitoring Area
export const saveMonitoringArea = async (req: Request, res: Response): Promise<void> => {
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
        const coords = await weatherService.getCoordinates(startArea);

        // 2. Get AI Analysis (Graceful fallback built into service)
        const areaAiSummary = await aiService.generateAreaClimateAnalysis(startArea, endArea);
        console.log("Area AI Summary:", areaAiSummary);

        // 3. Upsert to DB
        const monitoringArea = await prisma.monitoringArea.upsert({
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

    } catch (error) {
        console.error("Error saving monitoring area:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get Dashboard Data (Live + Caching)
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const monitoringArea = await prisma.monitoringArea.findUnique({
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
                weather = await weatherService.getCurrentWeather(monitoringArea.startLat, monitoringArea.startLon);
                history = await weatherService.getHistoricalContext(monitoringArea.startLat, monitoringArea.startLon);
            }
        } catch (err) {
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
            await prisma.monitoringArea.update({
                where: { userId },
                data: {
                    cachedWeatherData: JSON.stringify({ climateData, historicalData: history })
                }
            });

        } else {
            // Fallback: Cache or Mock
            if (monitoringArea.cachedWeatherData) {
                console.log("Serving cached dashboard data for user", userId);
                const cached = JSON.parse(monitoringArea.cachedWeatherData);
                climateData = cached.climateData;
                history = cached.historicalData;
            } else {
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

    } catch (error) {
        console.error("Error getting dashboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
