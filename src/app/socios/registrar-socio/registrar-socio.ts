import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';

@Component({
  selector: 'app-registrar-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  templateUrl: './registrar-socio.html',
  styleUrls: ['./registrar-socio.css'],
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class RegistrarSocio {
  socioForm: FormGroup;
  showPassword = false;
  ionEye = ionEye;
  ionEyeOff = ionEyeOff;
  isSubmitting = false; // ⬅ evita múltiples clics

  constructor(
    private fb: FormBuilder,
    private sociosService: SociosService,
    private router: Router
  ) {
    this.socioForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required,Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      logo: ['', [Validators.required, Validators.pattern(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i)]]
    });
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async registrar() {
    if (this.isSubmitting) return; // evita doble envío
    this.isSubmitting = true;

    if (this.socioForm.invalid) {
      this.socioForm.markAllAsTouched();
      this.isSubmitting = false;
      return;
    }
    try {
      await this.sociosService.createSocio(this.socioForm.value);
      alert('Socio registrado con éxito');
      this.router.navigate(['/socios']);
    } catch (error: any) {

      if (error.message === 'EMAIL_EXISTS') {
        alert('El correo ingresado ya está registrado.');
      } else {
        console.error('Error al registrar socio:', error);
        alert('Error al registrar socio. Intente nuevamente.');
      }

    } finally {
      this.isSubmitting = false; // vuelve a habilitar el botón
    }
  }

  cancelar() {
    this.router.navigate(['/socios']);
  }
}
