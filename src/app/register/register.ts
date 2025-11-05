import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
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
  pendingId : string = "";                  //ID esperado del usuario que solicita el OTP
  otpError: string = "";                    //Error a mostrar en caso que aparezcan
  showOTPModal = false;                     //Modal del OTP
  timeLeft: number = 120;                   //2 minutos en segundos
  private timerInterval: any;
  otpForm: FormGroup;

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

    this.otpForm = this.fb.group({
      digits: this.fb.array(Array(6).fill(null).map(() => new FormControl('', [Validators.required, Validators.pattern(/^\d*$/)])))
    });
  }

  ngOnInit() {
    this.areas$ = this.firebaseService.getAreas();
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  //Getters como dígitos array o como string
  get OTPDigits() {
    return this.otpForm.get('digits') as FormArray;
  }
  get OTPCode(){
    return this.OTPDigits.controls.map(control => control.value).join('');
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

  onOtpInput(event: any, index: number){
    const input = event.target;
    const value = input.value;

    //Solo permitimos valores numéricos
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.OTPDigits.at(index).setValue('');
      return;
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelectorAll('.otp-input')[index + 1] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
    
    this.otpError = ''; // Clear error when user types
  }

  //Checamos se presione el botón de borrar
  onOtpKeyDown(event: KeyboardEvent, index: number){
    // Handle backspace
    if (event.key === 'Backspace' && !this.OTPDigits.at(index).value && index > 0) {
      const prevInput = document.querySelectorAll('.otp-input')[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.OTPDigits.at(index-1).setValue(''); //Eliminamos el valor previo
      }
    }
  }

  //Checamos que se copie el código
  onOtpPaste(event: ClipboardEvent){
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text');
    if (pasteData && /^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      digits.forEach((digit, index) => {
        if (index < 6){
          this.OTPDigits.at(index).setValue(digit);   //Agregamos el valor para cada uno de los dígitos
        }
      })
      this.otpError = '';
      
      // Focus the last input
      setTimeout(() => {
        const lastInput = document.querySelectorAll('.otp-input')[5] as HTMLInputElement;
        if (lastInput) lastInput.focus();
      }, 0);
    }
  }

  //Checamos que el código haya sido completado
  isOtpComplete(): boolean {
    return this.OTPDigits.controls.every(control => control.valid && control.value); 
  }

  //Función para demostrar los segundos que han pasado
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startTimer() {
    this.timeLeft = 120; //Reseteamos a 2 minutos
    clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0){
        this.timeLeft--;
      } else {
        clearInterval(this.timerInterval)
      }
    }, 1000);
  }

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
        this.startTimer();        //Activamos el contador
        this.otpForm.reset();     // Reset OTP inputs
        this.otpError = '';       // Clear any previous errors

        //Aplicamos focus al input
        setTimeout(() => {
          const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      },
      error: err => {
        console.log(`Error solicitando el otp, error tipo: ${err}`)
        alert("Error solicitando el OTP")
      }
    })
  }

  async onConfirmOTP() {
    //Validamos que el código esté completo
    if (!this.isOtpComplete()){
      this.otpError = "Por favor rellena todos los dígitos";
      return;
    }

    this.otpService.verifyOTP(this.pendingId, this.OTPCode).subscribe({
      next: async() => {
        //Aquí, si funciona y no hay error, si creamos al usuario
        await this.firebaseService.addUser(this.registerForm.value);
        console.log("Usuario agregado correctamente:");
        clearInterval(this.timerInterval);
        this.router.navigate(['/login']);
      },
      error: err => {
        this.otpError = err.error.message;
        //Aplicamos una animación de error
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach(input => {
          input.classList.add('error');
          setTimeout(() => input.classList.remove('error'), 300);
        });
      }
    })
  }

  async onResendOTP(){
    //Prevenimos que se envíe durante el cooldown
    if (this.timeLeft > 0) return;

    this.otpService.resendOTP(this.pendingId, this.registerForm.value.email).subscribe({
      next: () => {
        this.startTimer();                  //Reiniciamos timer
        this.otpForm.reset();               //Limpiamos imput
        this.otpError = '';                 //Limpiamos errores
        alert("Código reenviado ✅"),

        // Focus first input
        setTimeout(() => {
          const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      },
      error: err => {
        this.otpError = err.error.message;
      }
    })
  }

  onCancelOTP(){
    this.showOTPModal = false;
    clearInterval(this.timerInterval);
    this.otpForm.reset();
    this.otpError = '';
  }

  ngOnDestroy() {
    // Clean up timer when component is destroyed
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onCancelClick() {
    this.router.navigate(['/']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
}