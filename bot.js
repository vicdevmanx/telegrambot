import express from "express"
import axios from "axios"
import dotenv from 'dotenv';


const app = express();
const PORT = 8080;
dotenv.config();

//middleware
app.use(express.json())

//controllers
const sessions = {}
const sendMsg = (id, msg, username) => {

}

app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to vicassistant bot!" })
})

app.post("/webhook/telegram", async (req, res) => {
    console.log(req.body)
    const { from, text } = req?.body?.message || req.body.edited_message
    const id = from.id
    const msg = text
    const username = from.first_name
    if (!sessions[id]) sessions[id] = [];

    // Push user message
    sessions[id].push({ role: 'user', content: msg });

    // Limit to last 5 messages
    const context = sessions[id].slice(-10);

    // Add your system prompt
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

    await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: process.env.MODEL,
        messages: aiMessages
    },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_ROUTER_KEY}`,
                'HTTP-Referer': 'https://telegrambot-rho-nine.vercel.app'
            }
        }).then(response => {
            console.log('-----------------bot request made')
            console.log(response.data.choices[0].message.content)
            response?.data?.choices[0]?.message?.content && sessions[id].push({ role: 'assistant', content: response.data.choices[0].message.content })
            axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, { chat_id: id, text: response?.data?.choices[0]?.message?.content || 'sorry try again later!' });
            console.log('---------dooonnneee')
        }
        ).catch(err => {
            console.log(err)
            axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, { chat_id: id, text: `Hi ${username}! we are currently not available, try again later!` });

        })

        console.log(sessions[id])
    res.status(200).send('OK');
})

app.listen(PORT, () => {
    console.log(`bot running on 127.0.0.1:${PORT}`)
});
