import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import bycrypt from 'bcryptjs';
import { sendEmail } from "./sendEmail"
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH!;
if (!svcPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH no preparado")

//Intentamos parsear el JSON, utilizando la librería fs y path, para leer el path del serviceAccountKey
const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(svcPath), "utf-8"));

//Checamos que la aplicación esté en existencia
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}
const db = admin.firestore();

function generateCode(){
    //Función encargada de generar un número garantizado de 6 dígitos, de forma aleatoria, preferimos usar
    //crypto ya que nos da los números incluyendo números antes
    const n = crypto.randomInt(100000,  1000000);
    return String(n);
}

export async function requestOTP(purpose: string, email: string){
    //Ésta función se encarga de solicitar un OTP, dado un propósito, un email destino, y un payload
    //payload en éste caso puede ser información del usuario [userData] (con password sin hashear)

    //Creamos una nueva collección para usuarios en espera en firestore
    const pendingRef = await db.collection("pending-users").add({
        createdAt: admin.firestore.FieldValue.serverTimestamp() //Hora creación
    });
    const pendingId = pendingRef.id;

    //Ahora, nos encargamos de generar el código, aplicamos un hash de dicho código para que al guardarlo no haya problemas
    //y otros datos de importancia
    const code = generateCode();
    const codeHash = await bycrypt.hash(code, 10);
    const now = new Date();  //Hora de creación del otp
    const expireAt = new Date(now.getTime() + 2 * 60 * 1000); //Hacemos que espere 2 minutos... pasados al tiempo de milisegundos a frames, a minutos
    
    const otpDoc = {
        pendingId,
        email,
        purpose,
        codeHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: admin.firestore.Timestamp.fromDate(expireAt),
        attemps: 0, //Intentos realizados
        sentCount: 1, //Veces enviado el código
        lastSent: admin.firestore.FieldValue.serverTimestamp(),
        used: false
    };

    //Ahora, realmente si creamos en nuestra base de firestore el documento con su propia id
    const otpRef = await db.collection("OTPS").doc();
    await otpRef.set(otpDoc);

    //Luego, nos proponemos a enviar el correo usando el template creado
    const html = otpEmailTemplate(code, purpose, expireAt);
    await sendEmail(
        email, 
        `Código de verificación (${purpose})`,
        html
    );

    //Retornamos la ID del esperado
    return pendingId;
}

export async function verifyOTP(pendingId: string, code: string, purpose: string){
    //Esta función se encarga de esperar o solicitar el código OTP, una vez recibido, en caso de ser el correcto, se borra el rastro del
    //registro del código
    
    //Primero, solicitamos el último OTP basado en el pendingID y el propósito
    const q = await db.collection("OTPS")
        .where("pendingId", "==", pendingId)
        .where("purpose", "==", purpose)
        .orderBy("createdAt", "desc") //Ordenamos buscando la colección y que busque el más nuevo
        .limit(1) //Solicitamos que solo nos entregue 1, no una colección, sino el último
        .get();
    //Una vez tenemos q, validamos que el valor no esté vacío
    if (q.empty) throw new Error("Error, OTP no encontrado en backend");
    //Extraemos la data del OTP
    const doc = q.docs[0];
    const data = doc.data() as any;

    //Validamos el caso que ya dicho OTP estuviera usado (no debería suceder)
    if (data.used) throw new Error("ERROR, la OTP ya ha sido usada");

    //Validamos el caso de que se haya expirado o que ya haya alcanzado el número máximo de intentos
    const now = admin.firestore.Timestamp.now();
    if (data.expireAt && data.expireAt.toMillis() < now.toMillis()){
        throw new Error("Error, el tiempo de la OTP ya ha expirado");
    }
    if ((data.attemps || 0) >= 5){
        throw new Error("Error, máximos intentos alcanzados");
    }

    //Ahora, una vez validamos intentos, expiración y uso, nos toca validar si funciona, si dicho fuera el caso, entonces...
    //debemos de tirar un mensaje o forma para dar a entender al frontend que se llame a la función que venía siguiente, y que
    //se continúe

    const ok = await bycrypt.compare(code, data.codeHash);
    if (!ok) {
        //Incrementamos la cantidad de intentos gastados
        await doc.ref.update( { attemps: (data.attemps || 0 ) + 1})
        throw new Error("Error, código ingresado incorrecto")
    }

    //En el caso de que si hayamos reconocido el código OTP, lo marcamos como usado
    await doc.ref.update( { used: true })

    //Todavía no sé, return true y eliminamos al usuario de la lista de usuarios en espera
    await db.collection("pending-users").doc(pendingId).delete();
    return true;
}

export async function resendOTP(pendingId: string, purpose: string, email: string){
    //Igual, volvemos a utilizar el método para extraer el OTP
    //Primero, solicitamos el último OTP basado en el pendingID y el propósito
    const q = await db.collection("OTPS")
        .where("pendingId", "==", pendingId)
        .where("purpose", "==", purpose)
        .orderBy("createdAt", "desc") //Ordenamos buscando la colección y que busque el más nuevo
        .limit(1) //Solicitamos que solo nos entregue 1, no una colección, sino el último
        .get();
    if (q.empty) throw new Error("Error, OTP no encontrado en backend");
    
    const doc = q.docs[0];
    const data = doc.data() as any;

    //Checamos si se ha alcanzado el límite de reenvíos (máximo 3)
    if ((data.sentCount || 0) >= 3){
        throw new Error("Error, se alcanzó el número máximo de envíos del código")
    };

    //Checamos el cooldown de 1 minuto para volver a enviar el código de nuevo
    const now = admin.firestore.Timestamp.now();
    const lastSent = data.lastSent ? (data.lastSent as admin.firestore.Timestamp) : null;
    if (lastSent && now.toMillis() - lastSent.toMillis() < 60 * 1000){
        //Pasamos el tiempo guardado del reenvío a milisegundos y nos ponemos a comparar si ha pasado al menos 1 minuto
        throw new Error("Error, espere un minuto al menos antes de solicitar otro código");
    }

    //Una vez se han hecho la validación de reenvíos y de tiempo, creamos el código de nuevo y lo guardamos
    const code = generateCode();
    const codeHash = await bycrypt.hash(code, 10);
    const expireAt = new Date(Date.now() + 2 * 60 * 1000); //Expira en 2 minutos
    await doc.ref.update({
        codeHash,
        expireAt: admin.firestore.Timestamp.fromDate(expireAt),
        attemps: (data.attemps || 0),
        sentCount: (data.sentCount || 1) + 1, //Veces enviado el código
        lastSent: admin.firestore.FieldValue.serverTimestamp(),
        used: false
    });

    //Luego, nos proponemos a enviar el correo usando el template creado
    const html = otpEmailTemplate(code, purpose, expireAt);
    await sendEmail(email, `Código de verificación (${purpose})`, html);
} 

function otpEmailTemplate(code: string, purpose: string, expireAt: Date){
    const formattedTime = expireAt.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Costa_Rica'
    });

    const formattedDate = expireAt.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificación</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f6f8fa;
                    margin: 0;
                    padding: 20px;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e1e5e9;
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 40px 30px;
                    text-align: center;
                    color: white;
                }
                
                .logo {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    letter-spacing: -0.5px;
                }
                
                .logo-subtitle {
                    font-size: 16px;
                    font-weight: 400;
                    opacity: 0.9;
                }
                
                .content {
                    padding: 40px;
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 16px;
                    line-height: 1.3;
                }
                
                .description {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #4a5568;
                    margin-bottom: 32px;
                }
                
                .otp-container {
                    text-align: center;
                    margin: 40px 0;
                }
                
                .otp-code {
                    display: inline-block;
                    font-size: 42px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    color: #2d3748;
                    background: linear-gradient(135deg, #f7f9fc 0%, #edf2f7 100%);
                    padding: 20px 40px;
                    border-radius: 12px;
                    border: 2px dashed #cbd5e0;
                    font-family: 'Courier New', monospace;
                }
                
                .purpose-badge {
                    display: inline-block;
                    background: #e6fffa;
                    color: #234e52;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 20px;
                }
                
                .info-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 30px 0;
                }
                
                .info-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #4a5568;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .info-content {
                    font-size: 15px;
                    color: #2d3748;
                    line-height: 1.5;
                }
                
                .warning {
                    background: #fff5f5;
                    border: 1px solid #fed7d7;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 24px 0;
                }
                
                .warning-title {
                    color: #c53030;
                    font-weight: 600;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .warning-content {
                    color: #742a2a;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .footer {
                    background: #f8fafc;
                    padding: 30px 40px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                
                .footer-text {
                    font-size: 14px;
                    color: #718096;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }
                
                .support {
                    color: #4a5568;
                    font-weight: 500;
                    margin-top: 16px;
                }
                
                .support a {
                    color: #667eea;
                    text-decoration: none;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 30px 24px;
                    }
                    
                    .header {
                        padding: 30px 24px 20px;
                    }
                    
                    .otp-code {
                        font-size: 32px;
                        letter-spacing: 6px;
                        padding: 16px 30px;
                    }
                    
                    .footer {
                        padding: 24px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">Gestión Proyectos</div>
                    <div class="logo-subtitle">Plataforma de Gestión de Proyectos</div>
                </div>
                
                <div class="content">
                    <div class="purpose-badge">${purpose}</div>
                    
                    <h1 class="greeting">Verificación de Seguridad Requerida</h1>
                    
                    <p class="description">
                        Para completar tu solicitud de <strong>${purpose}</strong>, utiliza el siguiente código 
                        de verificación de un solo uso. Este código es confidencial y no debe ser compartido.
                    </p>
                    
                    <div class="otp-container">
                        <div class="otp-code">${code}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-title">⏰ Válido hasta</div>
                        <div class="info-content">
                            ${formattedTime} · ${formattedDate}<br>
                            <strong>Expira en 2 minutos</strong>
                        </div>
                    </div>
                    
                    <div class="warning">
                        <div class="warning-title">⚠️ Advertencia de Seguridad</div>
                        <div class="warning-content">
                            • Nunca compartas este código con nadie<br>
                            • Nuestro equipo nunca te pedirá este código por teléfono o email<br>
                            • Si no solicitaste este código, ignora este mensaje
                        </div>
                    </div>
                    
                    <p class="description" style="margin-bottom: 0; font-size: 14px;">
                        Si tienes problemas para ingresar el código, puedes solicitar uno nuevo desde la aplicación.
                    </p>
                </div>
                
                <div class="footer">
                    <p class="footer-text">
                        © 2024 Gestión Proyectos. Todos los derechos reservados.<br>
                        Este es un mensaje automático, por favor no respondas a este correo.
                    </p>
                    <div class="support">
                        ¿Necesitas ayuda? <a href="mailto:soporte@tudominio.com">Contactar al soporte</a>
                    </div>
                </div>
            </div>
        </body>
        </html>    
    `;
}
    
