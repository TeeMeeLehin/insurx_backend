import axios from 'axios';
import { config } from '../config/env';

const BASE_URL = 'https://api.openweathermap.org';

interface Coordinates {
    lat: number;
    lon: number;
}

interface WeatherData {
    temp: number;
    humidity: number;
    description: string;
    windSpeed: number;
    precipitation: number; // 1h volume
}

export const weatherService = {
    // Geocoding: Convert City Name to Lat/Lon
    async getCoordinates(location: string): Promise<Coordinates | null> {
        try {
            const response = await axios.get(`${BASE_URL}/geo/1.0/direct`, {
                params: {
                    q: location,
                    limit: 1,
                    appid: config.OPENWEATHER_API_KEY
                },
                timeout: 5000 // 5s timeout
            });

            if (response.data && response.data.length > 0) {
                return {
                    lat: response.data[0].lat,
                    lon: response.data[0].lon
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching coordinates for ${location}:`, error);
            return null;
        }
    },

    // Current Weather
    async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
        try {
            const response = await axios.get(`${BASE_URL}/data/2.5/weather`, {
                params: {
                    lat,
                    lon,
                    units: 'metric',
                    appid: config.OPENWEATHER_API_KEY
                },
                timeout: 5000 // 5s timeout
            });

            const data = response.data;
            return {
                temp: data.main.temp,
                humidity: data.main.humidity,
                description: data.weather[0].description,
                windSpeed: data.wind.speed,
                precipitation: data.rain ? data.rain['1h'] || 0 : 0
            };
        } catch (error) {
            console.error(`Error fetching weather for ${lat},${lon}:`, error);
            return null;
        }
    },

    // Historical (Mocked for now as standard API requires paid OneCall 3.0 subscription for history or separate endpoint)
    // We will use a calculated "past" metric or mock it smartly based on current to avoid 401s if the key isn't enabled for history.
    async getHistoricalContext(lat: number, lon: number) {
        // In a production app with the right subscription, we would call:
        // /data/3.0/onecall/timemachine?lat={lat}&lon={lon}&dt={time}
        // For this demo, we'll return simulated 5-day history data
        return [
            { date: "4 days ago", temp: 28, risk: "Low" },
            { date: "3 days ago", temp: 29, risk: "Low" },
            { date: "2 days ago", temp: 30, risk: "Moderate" },
            { date: "Yesterday", temp: 27, risk: "Low" },
            { date: "Today", temp: 28, risk: "Low" }
        ];
    }
};
