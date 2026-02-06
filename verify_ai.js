const axios = require('axios');

async function test() {
    try {
        console.log("1. Registering temp user...");
        const email = `ai_test_${Date.now()}@test.com`;
        const regRes = await axios.post('http://localhost:4000/api/auth/signup', {
            email,
            password: "password123",
            fullName: "AI Test User"
        });
        const token = regRes.data.token;
        console.log("Token obtained.");

        console.log("2. Testing Risk Assessment (Targeting Gemini)...");
        const res = await axios.post('http://localhost:4000/api/risk-assessment', {
            location: "Accra",
            propertyValue: 100000
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", res.status);
        console.log("Risk Score:", res.data.assessment.riskScore);
        console.log("AI Analysis:", res.data.assessment.aiAnalysis);

        if (res.data.assessment.aiAnalysis && !res.data.assessment.aiAnalysis.includes("pending")) {
            console.log("SUCCESS: AI Analysis generated.");
        } else {
            console.log("WARNING: AI Analysis might be pending or failed.");
        }

    } catch (error) {
        if (error.response) {
            console.error("Error Status:", error.response.status);
            console.error("Error Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

test();
