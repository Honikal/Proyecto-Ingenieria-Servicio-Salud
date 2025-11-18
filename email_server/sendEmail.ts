import nodemailer from 'nodemailer';
import { google } from "googleapis";
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;
const USER_MAIL = process.env.GMAIL_USER!;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export const sendEmail = async (toEmail: string, subject: string, htmlContent: string) => {
    /*Función encargada de enviar un mensaje cualquiera al correo del usuario, para notificar de
    información importante a considerar*/
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: "OAUTH2",
                user: USER_MAIL,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken?.token || "",
            },
        });

        const mailOption = {
            from: `Servicio de Salud Ocupacional Brindado por el tec <${USER_MAIL}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent,
            text: `Tu código de verificación es: ${extractCodeFromHTML(htmlContent)}. Por favor ingrésalo en la aplicación.`
        };

        const result = await await transporter.sendMail(mailOption);
        return result;
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