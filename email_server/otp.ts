import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import bycrypt from 'bcryptjs';
import { sendEmail } from "./sendEmail"
import dotenv from 'dotenv';
import crypto from 'crypto';
import { renderOTPTemplate } from './templates/templateUtils';

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

    return renderOTPTemplate(code, purpose, formattedTime, formattedDate);
}
    
