import express from "express"
import axios from "axios"
import dotenv from 'dotenv';


const app = express();
const PORT = 8080;
dotenv.config();

//middleware
app.use(express.json())

//controllers
const sendMsg = (id, msg) => {
    axios.post(`${process.env.TELEGRAM_BASE_URL}/sendMessage`, {chat_id: id, text: `you said ${msg}`})
}

app.get("/", (req, res) => {
    res.status(200).json({ message: "welcome to vicassistant bot!" })
})

app.post("/webhook/telegram", async (req, res) => {
    console.log(result)
    const {ok, result } = req.body
    // const id = result[result.length-1].message.from.id
    // const msg = result[result.length-1].message.text
    // sendMsg(id, msg)
    res.status(200).send('OK');
})

app.listen(PORT, () => {
    console.log(`bot running on 127.0.0.1:${PORT}`)
});
