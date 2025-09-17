import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SociosService, Socio } from '../socios.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-gestionar-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-socio.component.html',
  styleUrls: ['./gestionar-socio.component.css']
})
export class GestionarSocioComponent implements OnInit {
  socioForm!: FormGroup;
  socioId!: string;
  cargando = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sociosService: SociosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Inicializar form vacío
    this.socioForm = this.fb.group({
      nombre: [''],
      cantidadAsociados: [0],
      email: [''],
      telefono: ['']
    });

    // Suscripción para escuchar cambios en el id
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.socioId = id;
        console.log('ID recibido desde la ruta:', id);

        const socio = await this.sociosService.getSocioById(id);
        console.log('Socio recibido desde Firestore:', socio);

        if (socio) {
          this.socioForm.patchValue({
            nombre: socio.nombre,
            cantidadAsociados: socio.cantidadAsociados,
            email: socio.email,
            telefono: socio.telefono
          });
          this.cdr.detectChanges();
        }

        this.cargando = false;
      }
    });
  }

  async guardarCambios() {
    if (this.socioForm.valid) {
      await this.sociosService.updateSocio(this.socioId, this.socioForm.value);
      alert('Cambios guardados correctamente');
    }
  }

  async eliminarSocio() {
    await this.sociosService.deleteSocio(this.socioId);
    alert('Socio eliminado');
    this.router.navigate(['/socios']);
  }

  volver() {
    this.router.navigate(['/socios']);
  }
}