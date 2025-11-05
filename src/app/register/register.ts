import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { FirebaseService } from '../services/firebase';
import { OTPService } from '../services/otp.service'; 
import { Observable } from 'rxjs';
import { Area } from '../../models/area.model';
import { CommonModule } from '@angular/common';
import { OtpModal } from '../otp-modal/otp-modal';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule, OtpModal],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class Register {
  showPassword = false;
  registerForm: FormGroup;
  areas$: Observable<Area[]> = new Observable<Area[]>();

  //Manejo del otp
  showOTPModal = false;                     //Modal del OTP
  isSubmitting = false;                     //Estado del OTP o del código en subida o no

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

    //Activamos entonces el modal
    this.isSubmitting = true;
    this.showOTPModal = true;
  }

  //===============Eventos de Modal===============//
  onOtpVerified(){
    this.completeRegistration();
  }
  onOtpCancelled(){
    this.showOTPModal = false;
    this.isSubmitting = false;
  }
  onOtpError(error: string){
    console.error('OTP Error:', error);
    // You can show a global error message if needed
  }

  //===============Función principal de registro===============//
  private async completeRegistration(){
    try {
      await this.firebaseService.addUser(this.registerForm.value);
      console.log("Usuario agregado correctamente:");
      this.router.navigate(['/login']);
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar");
    } finally {
      //Una vez es terminado...
      this.showOTPModal = false;
      this.isSubmitting = false;
    }
  }

  onCancelClick() {
    this.router.navigate(['/']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
}