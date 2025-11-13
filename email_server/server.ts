import express from "express";
import cors from "cors";
import { sendEmail } from "./sendEmail";
import { requestOTP, verifyOTP, resendOTP } from "./otp"
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 4000; 
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

app.post("/auth/request-otp", async (req, res) => {
    //Encargado de solicitar el otp
    console.log("📩 Recibí request en /auth/request-otp:", req.body);

    //Extraemos el destino del correo, el asunto y la descripción  
    const {email, purpose} = req.body;

    try {
        const pendingId = await requestOTP(purpose, email)
        console.log("✅ Correo enviado, se ha adjuntado el OTP con pendingID:", pendingId);
        res.json({ success: true, pendingId });
    } catch(error: any){
        console.error("❌ Error en /auth/request-otp:", error);
        res.status(500).json({ success: false, message: error.message});
    }
});

app.post("/auth/verify-otp", async (req, res) => {
    //Encargado de solicitar el otp
    console.log("📩 Recibí request en /auth/verify-otp:", req.body);

    //Extraemos el destino del correo, el asunto y la descripción  
    const { pendingId, code, purpose } = req.body;

    try {
        const result = await verifyOTP( pendingId, code, purpose)
        console.log("✅ Se ha ingresado el código OTP de forma correcta, se ha enviado el mensaje:", result);
        res.json({ success: true, msg: result });
    } catch(error: any){
        console.error("❌ Error en /auth/verify-otp:", error);
        res.status(500).json({ success: false, message: error.message});
    }
});

app.post("/auth/resend-otp", async (req, res) => {
    //Encargado de solicitar el otp
    console.log("📩 Recibí request en /auth/resend-otp:", req.body);

    //Extraemos el destino del correo, el asunto y la descripción  
    const { pendingId, purpose, email } = req.body;

    try {
        await resendOTP(pendingId, purpose, email);
        console.log("✅ Correo enviado, se ha vuelto a enviar un nuevo código");
        res.json({ success: true });
    } catch(error: any){
        console.error("❌ Error en /auth/resend-otp:", error);
        res.status(500).json({ success: false, message: error.message});
    }
});


app.listen(PORT, () => {
    console.log("✅ Email server running on port 4000")
})