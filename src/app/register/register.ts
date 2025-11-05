import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase';
import { OTPService } from '../services/otp.service'; 
import { EmailService } from '../services/email.service';
import { Observable } from 'rxjs';
import { Area } from '../../models/area.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class Register {
  showPassword = false;
  registerForm: FormGroup;
  areas$: Observable<Area[]> = new Observable<Area[]>();

  //Manejo del otp
  pendingId : string = ""; //ID esperado del usuario que solicita el OTP
  otpCode: string = "";    //Código del OTP que el usuario ingrese
  otpError: string = "";   //Error a mostrar en caso que aparezcan
  showOTPModal = false;    //Modal del OTP

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private otpService: OTPService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      area: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,}$/)]]
    });
  }

  ngOnInit() {
    this.areas$ = this.firebaseService.getAreas();
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  /*
  async onSignUpClick() {
    if (this.registerForm.valid) {
      try {
        await this.firebaseService.addUser(this.registerForm.value);

        //Correo de notificación de ingreso al sistema
        this.emailService.sendEmailNotification(
          this.registerForm.value.email,
          "Bienvenido a la Aplicación de Salud Ocupacional del TEC",
          "Este es un correo de prueba, si funciona, entonces estaremos salvados"
        ).subscribe({
          next: (resp) => console.log("✅ Email enviado desde Angular", resp),
          error: (err) => console.error("❌ Error enviando email desde Angular", err) 
        });

        console.log("Usuario agregado correctamente:");
        this.router.navigate(['/login']);
      } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error al registrar");
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
  */

  async onSignUpClick() {
    //Validamos el formulario
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    //Llamamos la función encargada de enviar el código y activamos el modal
    const email = this.registerForm.value.email;

    this.otpService.requestOTP(email).subscribe({
      next: (resp: any) => {
        this.pendingId = resp.pendingId;
        this.showOTPModal = true; //Mostramos el MODAL OTP para introducir el código
      },
      error: err => {
        console.log(`Error solicitando el otp, error tipo: ${err}`)
        alert("Error solicitando el OTP")
      }
    })

  }

  async onConfirmOTP() {
    this.otpService.verifyOTP(this.pendingId, this.otpCode).subscribe({
      next: async() => {
        //Aquí, si funciona y no hay error, si creamos al usuario
        await this.firebaseService.addUser(this.registerForm.value);
        console.log("Usuario agregado correctamente:");
        this.router.navigate(['/login']);
      },
      error: err => {
        this.otpError = err.error.message;
      }
    })
  }

  async onResendOTP(){
    this.otpService.resendOTP(this.pendingId, this.registerForm.value.email).subscribe({
      next: () => alert("Código reenviado ✅"),
      error: err => {
        this.otpError = err.error.message;
      }
    })
  }

  onCancelOTP(){
    this.showOTPModal = false;
  }

  onCancelClick() {
    this.router.navigate(['/']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
}