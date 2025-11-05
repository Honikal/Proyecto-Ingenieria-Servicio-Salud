import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
    //Esta clase se encargará de conectar con el backend y se encargará de tanto enviar correos de notificacion
    //como los correos esperando un código OTP

    private apiURL = 'http://localhost:4000/send-email'; //TODO Cambiar la url privada por una funcional a la hora de hostear

    constructor(private http: HttpClient) {}

    sendEmailNotification(to: string, subject: string, message: string): Observable<any> {
        console.log(`Recibimos los datos:   to: <${to}>   subject: <${subject}>   message: <${message}>`);
        return this.http.post(this.apiURL, {to, subject, message});
    }
}

