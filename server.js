require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
        model: 'gemini-2.0-flash'
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

    console.log('Gemini Error:', error);

    return 'Sorry, AI response abhi available nahi hai.';
}

}

// ==========================================
// SEND WHATSAPP MESSAGE (WAAPI)
// ==========================================

async function sendWhatsAppMessage(to, message) {

try {

    const response = await axios.post(
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

    console.log('Message Sent:', response.data);

} catch (error) {

    console.log(
        'Send Message Error:',
        error.response?.data || error.message
    );
}

}

// ==========================================
// WEBHOOK
// ==========================================

app.post('/webhook', async (req, res) => {

try {

    console.log(
        'Webhook Data:',
        JSON.stringify(req.body, null, 2)
    );

    const data = req.body;

    // Only process message events
    if (data.event !== 'message') {

        return res.sendStatus(200);
    }

    // Get sender
    const sender =
        data.data?.message?._data?.from ||
        data.from ||
        data.chatId;

    // Get message text
    const message =
        data.data?.message?._data?.body ||
        data.message?.text ||
        data.text ||
        '';

    if (!sender || !message) {

        console.log('No sender or message');

        return res.sendStatus(200);
    }

    console.log('Sender:', sender);
    console.log('Message:', message);

    // ==========================================
    // AI Reply
    // ==========================================

    const aiReply = await getAIReply(message);

    console.log('AI Reply:', aiReply);

    // ==========================================
    // Send WhatsApp Reply
    // ==========================================

    await sendWhatsAppMessage(sender, aiReply);

    return res.sendStatus(200);

} catch (error) {

    console.log('Webhook Error:', error);

    return res.sendStatus(500);
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
