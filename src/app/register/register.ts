import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase';  // Importa el servicio
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIconComponent, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class Register {
  showPassword: boolean = false;
  registerForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private firebaseService: FirebaseService   // Inyectamos el servicio
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      area: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,}$/)]]
    });
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async onSignUpClick() {
    if (this.registerForm.valid) {
      const user: User = this.registerForm.value;

      try {
        await this.firebaseService.addUser(user);
        console.log("Usuario agregado correctamente:", user);

        alert("Registro exitoso ✅");
        this.router.navigate(['/login']); // Redirige al login o donde quieras
      } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error al registrar ❌");
      }
    } else {
      console.log("Formulario inválido");
      this.registerForm.markAllAsTouched();
    }
  }

  onCancelClick() {
    this.router.navigate(['/']);
  }

  onLoginClick() {
    this.router.navigate(['/login']);
  }
}