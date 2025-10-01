import { Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private sociosService: SociosService,
    private router: Router
  ) {
    this.socioForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      logo: ['', Validators.required],
      cantidadAsociados: [0] 
    });
  }

  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async registrar() {
    if (!this.isAdmin) return; // seguridad extra
    if (this.socioForm.valid) {
      const socio: Omit<Socio, 'id'> = {
        ...this.socioForm.value,
        cantidadAsociados: 0,
        isActive: true
      };
      try {
        await this.sociosService.createSocio(socio);
        alert('Socio registrado con éxito');
        this.router.navigate(['/socios']);
      } catch (error) {
        console.error('Error al registrar socio:', error);
        alert('Error al registrar socio');
      }
    } else {
      this.socioForm.markAllAsTouched();
    }
  }

  cancelar() {
    this.router.navigate(['/socios']);
  }
}
