import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestionar-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-socio.html',
  styleUrls: ['./gestionar-socio.css']
})

export class GestionarSocio implements OnInit {
  socioForm!: FormGroup;
  socioId!: string;
  cargando = true;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sociosService: SociosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Revisa si el usuario logueado es admin
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.isAdmin = !!user.isAdmin;
    }

    // Form
    this.socioForm = this.fb.group({
      nombre: [{ value: '', disabled: !this.isAdmin }],
      cantidadAsociados: [{ value: 0, disabled: !this.isAdmin }],
      email: [{ value: '', disabled: !this.isAdmin }],
      telefono: [{ value: '', disabled: !this.isAdmin }]
    });

    // Cambios en la ruta
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
    if (!this.isAdmin) return; 
    if (this.socioForm.valid) {
      await this.sociosService.updateSocio(this.socioId, this.socioForm.value);
      alert('Cambios guardados correctamente');
    }
  }

  async eliminarSocio() {
    if (!this.isAdmin) return; 
    if (confirm('¿Seguro que deseas eliminar este socio?')) {
      await this.sociosService.deleteSocio(this.socioId);
      alert('Socio eliminado');
      this.router.navigate(['/socios']);
    }
  }

  volver() {
    this.router.navigate(['/socios']);
  }
}