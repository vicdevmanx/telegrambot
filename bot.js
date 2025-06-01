import express from "express"
import axios from "axios"

const app = express()
const PORT = 8080

app.get("/", (req, res) => {
    res.status(200).json({message: "welcome to vicassistant bot!"})
})



app.listen(PORT, () => {
console.log(`bot running on 127.0.0.1:${PORT}`)
})