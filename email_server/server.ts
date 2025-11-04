import express from "express";
import cors from "cors";
import { sendEmail } from "./sendEmail";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
    //Extraemos el destino del correo, el asunto y la descripción  
    const {to, subject, message} = req.body;

    try {
        await sendEmail(to, subject, message);
        res.json({ success: true, msg: "Correo enviado de forma esperada"});
    } catch(error){
        res.status(500).json({ success: false, msg: "Error sending email" });
    }
});

app.listen(4000, () => {
    console.log("✅ Email server running on port 4000")
})