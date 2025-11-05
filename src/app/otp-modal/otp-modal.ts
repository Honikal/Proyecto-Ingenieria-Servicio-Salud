import { Component, Output, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { OTPService } from '../services/otp.service'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-otp-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-modal.html',
  styleUrl: './otp-modal.css'
})
export class OtpModal implements OnInit, OnDestroy{
  @Input() email: string = '';
  @Input() purpose: string = '';
  @Input() title: string = 'Verificación de Correo';
  @Input() description: string = 'Hemos enviado un código de 6 dígitos a tu correo electrónico';

  @Output() verified = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  //Manejo del otp
  otpForm: FormGroup;
  pendingId : string = "";                  //ID esperado del usuario que solicita el OTP
  otpError: string = "";                    //Error a mostrar en caso que aparezcan
  timeLeft: number = 120;                   //2 minutos en segundos
  private timerInterval: any;               //Sistema para medir el tiempo
  isSubmitting : boolean = false;           //Determinar su función

  constructor(
    private fb: FormBuilder,
    private otpService: OTPService
  ) {
    this.otpForm = this.fb.group({
      digits: this.fb.array(Array(6).fill(null).map(() => new FormControl('', [Validators.required, Validators.pattern(/^\d*$/)])))
    });
  }

  //Getters como dígitos array o como string
  get OTPDigits() {
    return this.otpForm.get('digits') as FormArray;
  }
  get OTPCode(){
    return this.OTPDigits.controls.map(control => control.value).join('');
  }

  //Una vez es inicializado el OTP o creado, generamos el código
  ngOnInit(): void {
    this.intializeOTP();    
  }

  //=================Método de envío del Código OTP=================//
  intializeOTP(): void {
    //Validamos el correo
    if (!this.email){
      this.error.emit("Error a la hora de enviar el email, error con el usuario");
      return;
    }

    this.otpService.requestOTP(this.email, this.purpose).subscribe({
      next: (resp: any) => {
        this.pendingId = resp.pendingId;
        this.startTimer();        //Activamos el contador
        this.otpForm.reset();     // Reset OTP inputs
        this.otpError = '';       // Clear any previous errors

        //Aplicamos focus al input
        setTimeout(() => {
          const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      },
      error: (err) => {
        console.log(`Error solicitando el otp, error tipo: ${err}`);
        this.error.emit("Error solicitando el código de verificación");
      }
    })
  }

  //=================Métodos de INPUTS=================//
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

  onOtpKeyDown(event: KeyboardEvent, index: number){
    // Checamos se presione el botón de borrar
    if (event.key === 'Backspace' && !this.OTPDigits.at(index).value && index > 0) {
      const prevInput = document.querySelectorAll('.otp-input')[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.OTPDigits.at(index - 1).setValue(''); //Eliminamos el valor previo
      }
    }
  }

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

  isOtpComplete(): boolean {
    return this.OTPDigits.controls.every(control => control.valid && control.value); 
  }



  //=================Funciones extra de importancia=================//
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

  //=================Verificación de la OTP=================//
  onConfirmOTP() {
    //Validamos que el código esté completo
    if (!this.isOtpComplete()){
      this.otpError = "Por favor rellena todos los dígitos";
      return;
    }

    //Validamos que submitting sea falso
    if (this.isSubmitting) return;

    //Una vez pase ésto, convertimos submitting a true, dado que se ha subido el código
    this.otpService.verifyOTP(this.pendingId, this.OTPCode, this.purpose).subscribe({
      next: async() => {
        //Aquí, si funciona y no hay error, emitiremos una señal para indicar que si ha funcionado
        this.isSubmitting = true;
        this.verified.emit();
        this.clearTimer();
      },
      error: (err) => {
        //Aquí, sucede cuando se encuentra un posible error
        this.isSubmitting = false;
        this.otpError = err.error.message;

        //Aplicamos una animación de error
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach(input => {
          input.classList.add('error');
          setTimeout(() => input.classList.remove('error'), 300);
        });

        this.error.emit(err.error.message)
      }
    })
  }

  //=================Reenviar el Código=================//
  onResendOTP(){
    //Prevenimos que se envíe durante el cooldown, o en el caso que se esté enviando actualmente
    if (this.timeLeft > 0 || this.isSubmitting) return;

    this.otpService.resendOTP(this.pendingId, this.purpose, this.email).subscribe({
      next: () => {
        this.startTimer();                  //Reiniciamos timer
        this.otpForm.reset();               //Limpiamos imput
        this.otpError = '';                 //Limpiamos errores

        // Focus first input
        setTimeout(() => {
          const firstInput = document.querySelector('.otp-input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      },
      error: err => {
        this.otpError = err.error.message;
        this.error.emit(err.error.message);
      }
    })
  }

  //=================Funciones finales para cancelar o destruir OTP=================//
  onCancelOTP(){
    this.clearTimer();
    this.cancelled.emit();
  }

  private clearTimer(){
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }


  ngOnDestroy(): void {
    this.clearTimer();
  }
}
