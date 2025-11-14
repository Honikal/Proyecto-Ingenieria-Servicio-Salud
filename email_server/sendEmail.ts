import { Resend } from "resend";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.RESEND_API_KEY;
const ORIGIN_EMAIL = process.env.GMAIL_USER;
const resend = new Resend(API_KEY);

export async function sendEmail (
    toEmail: string,
    subject: string,
    htmlContent: string
) {
    /*Función encargada de enviar un mensaje cualquiera al correo del usuario, para notificar de
    información importante a considerar*/
    try {
        const response = await resend.emails.send({
            from: "Servicio Salud <onboarding@resend.dev>",
            to: toEmail,
            subject: subject,
            html: htmlContent
        })
        console.log("📨 Email enviado:", response);
        return response;
    } catch (error){
        console.error("Error enviando el correo desde Backend: ", error);
        throw error;
    }
}

// Helper function to extract the OTP code from HTML for the plain text fallback
function extractCodeFromHTML(html: string): string {
    const match = html.match(/class="otp-code">(\d{6})<\/div>/);
    return match ? match[1] : 'CÓDIGO NO ENCONTRADO';
}