import express from "express";
import cors from "cors";
import { sendEmail } from "./sendEmail";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-email", async (req, res) => {
    console.log("📩 Recibí request en /send-email:", req.body);

    //Extraemos el destino del correo, el asunto y la descripción  
    const {to, subject, message} = req.body;

    try {
        const result = await sendEmail(to, subject, message);
        console.log("✅ Correo enviado:", result);
        res.json({ success: true, msg: "Correo enviado de forma esperada"});
    } catch(error){
        console.error("❌ Error en /send-email:", error);
        res.status(500).json({ success: false, msg: "Error sending email" });
    }
});

app.listen(4000, () => {
    console.log("✅ Email server running on port 4000")
})