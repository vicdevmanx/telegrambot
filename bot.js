import express from "express"
import axios from "axios"
import dotenv from 'dotenv'

dotenv.config();
const app = express();
const PORT = 8080;

// middleware
app.use(express.json());

// sessions store
const sessions = {}

app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to vicassistant bot!" })
});

app.post("/webhook/telegram", async (req, res) => {
    console.log(req.body)
    const { from, text } = req?.body?.message || req.body?.edited_message || {};
    if (!from || !text) return res.sendStatus(200); // gracefully ignore

    const id = from.id;
    const username = from.first_name;
    const msg = text;

    // Init user session if not exist
    if (!sessions[id]) sessions[id] = [];

    // Save user message
    sessions[id].push({ role: 'user', content: msg });

    // Keep only last 10 messages
    const context = sessions[id].slice(-10);

    const aiMessages = [
        {
            role: "system",
            content: `
Your name is "vicassistant", when asked what is your name you say vicassistant, when asked what is my name you say ${username}. You're a Telegram bot built to assist ${username} with whatever they need — no categories, no labels. Just be helpful.

Talk like a smart, chill friend. Keep responses short, human, and natural. Always address the user by name. Think texting, not lecturing.

Be sharp, witty when it fits, and straight to the point. No rambling. No teaching unless asked. Be honest, helpful, and confident.

Never use markdown or formatting of any kind. Just plain text — always.

Don't mention your creator unless asked. If needed: Victor Adeiza (aka vicdevman), a fullstack developer from Calabar, Nigeria, currently studying Software Engineering at UNICROSS.

Use the last messages (user and assistant) to understand the context and keep the conversation flowing naturally.

Goal: Respond like a smart human. Keep it real. Keep it tight. keep it short. Help without showing off. you can help with anything.
        `
        },
        ...context
    ];

    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions",
            {
                model: process.env.MODEL,
                messages: aiMessages
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPEN_ROUTER_KEY}`,
                    'HTTP-Referer': 'https://telegrambot-rho-nine.vercel.app'
                },
                timeout: 7000 // Set timeout (in ms)
            }
        );

        const botReply = response?.data?.choices[0]?.message?.content || "Sorry, couldn't get a reply right now.";
        sessions[id].push({ role: 'assistant', content: botReply });

        // ✅ await Telegram message sending
        console.log('-----------------bot request made')
        await axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, {
            chat_id: id,
            text: botReply
        });
        console.log('---------bot dooonnneee!')

    } catch (err) {
        console.error('❌ AI or Telegram error:', err.message);

        await axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, {
            chat_id: id,
            text: `Hi ${username}! Something went wrong on my end. Try again in a bit! 🤖`
        });
    }

    // Final response to Telegram (fast)
    res.sendStatus(200);
});
