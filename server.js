require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ==========================================
// GEMINI AI SETUP
// ==========================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// AI REPLY FUNCTION
// ==========================================

async function getAIReply(userMessage) {

    try {

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        const prompt = `
You are Webnestic Tech Up AI Assistant.

Reply professionally in Hindi + English.

Services:
- Website Development
- SEO
- Google Ads
- Meta Ads
- WhatsApp Marketing
- AI Automation

Customer Message:
${userMessage}
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        return response.text();

    } catch (error) {

        console.log(error);

        return 'Sorry, AI response abhi available nahi hai.';
    }
}

// ==========================================
// SEND WHATSAPP MESSAGE (WAAPI)
// ==========================================

async function sendWhatsAppMessage(to, message) {

    try {

        await axios.post(
            `https://waapi.app/api/v1/instances/${process.env.WAAPI_INSTANCE_ID}/client/action/send-message`,
            {
                chatId: to,
                message: message
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WAAPI_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Message Sent');

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

// ==========================================
// WEBHOOK
// ==========================================

app.post('/webhook', async (req, res) => {

    try {

        console.log(JSON.stringify(req.body, null, 2));

        const data = req.body;

        const sender =
            data.from ||
            data.chatId;

        const message =
            data.message?.text ||
            data.text ||
            '';

        if (!sender || !message) {

            return res.sendStatus(200);
        }

        console.log('Sender:', sender);
        console.log('Message:', message);

        // AI Reply
        const aiReply = await getAIReply(message);

        // Send Reply
        await sendWhatsAppMessage(sender, aiReply);

        res.sendStatus(200);

    } catch (error) {

        console.log(error);

        res.sendStatus(500);
    }
});

// ==========================================
// HOME ROUTE
// ==========================================

app.get('/', (req, res) => {

    res.send('Waapi Gemini AI Bot Running 🚀');
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
