
import axios from 'axios';

const API_KEY = "AIzaSyBtK_qcmLZi-PIUhYBxZmStuEcBagn_rCA";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

async function testGemini() {
    console.log("Testing Gemini API...");
    try {
        const response = await axios.post(URL, {
            contents: [{
                parts: [{
                    text: "Write a one sentence test message confirming you are working."
                }]
            }]
        });

        console.log("✅ Success!");
        console.log("Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error: any) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testGemini();
