import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SociosService } from '../socios.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registrar-socio',
  standalone: true,
  templateUrl: './registrar-socio.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./registrar-socio.component.css']
})
export class RegistrarSocioComponent {
  socioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sociosService: SociosService,
    private router: Router
  ) {
    this.socioForm = this.fb.group({
      nombre: ['', Validators.required],
      cantidadAsociados: [0, [Validators.required, Validators.min(0)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
    });
  }

  registrar() {
    if (this.socioForm.valid) {
      this.sociosService.createSocio(this.socioForm.value).subscribe({
        next: () => {
          alert('Socio registrado correctamente');
          this.router.navigate(['/socios']);
        },
        error: err => {
          console.error('Error al registrar socio', err);
          alert('Ocurrió un error al registrar el socio');
        }
      });
    } else {
      this.socioForm.markAllAsTouched();
    }
  }

  cancelar() {
    this.router.navigate(['/socios']);
  }
}