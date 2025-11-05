import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OTPService {
    //Esta clase se encargará de conectar con el backend y se encargará de tanto enviar correos de notificacion
    //como los correos esperando un código OTP

    private API_URL = 'http://localhost:4000'; //TODO Cambiar la url privada por una funcional a la hora de hostear

    constructor(private http: HttpClient) {}

    requestOTP(email: string){
        return this.http.post(`${this.API_URL}/auth/request-otp`, 
        {
            email,
            purpose: "register",
        });
    }

    verifyOTP(pendingId: string, code: string){
        return this.http.post(`${this.API_URL}/auth/verify-otp`, 
        {
            pendingId,
            code, 
            purpose: "register"
        });
    }

    resendOTP(pendingId: string, email: string){
        return this.http.post(`${this.API_URL}/auth/resend-otp`, 
        {
            pendingId,
            purpose: "register",
            email,
        });
    }
}

