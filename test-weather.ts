
import axios from 'axios';

const API_KEY = "e3acea4e242d1c4c0162f9ea7f5314e6"; // Hardcoded for this test to be sure
const BASE_URL = 'https://api.openweathermap.org';

async function testConnection() {
    console.log("Testing OpenWeatherMap API Connection...");
    console.log(`Using Key: ${API_KEY}`);

    try {
        // 1. Test Geocoding API
        console.log("\n1. Testing Geocoding (Accra)...");
        const geoRes = await axios.get(`${BASE_URL}/geo/1.0/direct`, {
            params: {
                q: "Accra",
                limit: 1,
                appid: API_KEY
            }
        });
        console.log("✅ Geocoding Success:", geoRes.data);

        // 2. Test Current Weather API
        if (geoRes.data.length > 0) {
            const { lat, lon } = geoRes.data[0];
            console.log(`\n2. Testing Current Weather for Lat: ${lat}, Lon: ${lon}...`);
            const weatherRes = await axios.get(`${BASE_URL}/data/2.5/weather`, {
                params: {
                    lat,
                    lon,
                    units: 'metric',
                    appid: API_KEY
                }
            });
            console.log("✅ Weather Success:", weatherRes.data.weather[0].description);
        }

    } catch (error: any) {
        console.error("\n❌ API Test Failed!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testConnection();
