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
const sendMsg = (id, msg) => {

    if (!sessions[id]) sessions[id] = [];

    // Push user message
    sessions[id].push({ role: 'user', content: msg });

    // Limit to last 5 messages
    const context = sessions[id].slice(-5);

    // Add your system prompt
    const aiMessages = [
        {
            role: "system",
            content: `You're vicassistant a telegram bot so no markdown response format. Be short, friendly, smart, and humanlike and incase asked you can code. (created by victor adeiza aka vicdevman a fullstack developer a year one student in university of cross river (unicross) in calabar nigeria) don't say this part unless asked.`
        },
        ...context
    ];

    axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: "google/gemma-2b-it",
        messages: aiMessages
    },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_ROUTER_KEY}`,
                'HTTP-Referer': 'http://localhost:8080'
            }
        }).then(response =>
            axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, { chat_id: id, text: response?.data?.choices[0]?.message?.content || 'sorry try again later!' })
           (response?.data?.choices[0]?.message?.content && sessions[id].push({ role: 'assistant', content: response.data.choices[0].message.content }))
            
        ).catch(err =>
            console.log(err)
        )
}

app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to vicassistant bot!" })
})

app.post("/webhook/telegram", (req, res) => {
    console.log(req.body)
    const { from, text } = req.body.message
    const id = from.id
    const msg = text
    sendMsg(id, msg)
    res.status(200).send('OK');
})

app.listen(PORT, () => {
    console.log(`bot running on 127.0.0.1:${PORT}`)
});
