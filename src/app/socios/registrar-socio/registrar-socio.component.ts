import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SociosService, Socio } from '../socios.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registrar-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-socio.component.html',
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
      cantidadAsociados: [0, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required]
    });
  }

  async registrar() {
    if (this.socioForm.valid) {
      const socio: Omit<Socio, 'id'> = this.socioForm.value;
      await this.sociosService.createSocio(socio);
      alert('Socio registrado con éxito');
      this.router.navigate(['/socios']);
    }
  }

  cancelar() {
    this.router.navigate(['/socios']);
  }
}