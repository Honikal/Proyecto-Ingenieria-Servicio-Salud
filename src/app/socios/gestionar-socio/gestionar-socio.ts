import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ionEye, ionEyeOff } from '@ng-icons/ionicons';

@Component({
  selector: 'app-gestionar-socio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  templateUrl: './gestionar-socio.html',
  styleUrls: ['./gestionar-socio.css'],
  providers: [provideIcons({ ionEye, ionEyeOff })]
})
export class GestionarSocio implements OnInit {
  socioForm!: FormGroup;
  socioId!: string;
  cargando = true;
  isAdmin = false;
  socio?: Socio; // objeto del socio para acceder a isActive
  showPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sociosService: SociosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.isAdmin = !!user.isAdmin;
    }

    // Formulario
    this.socioForm = this.fb.group({
      nombre: [{ value: '', disabled: true }],
      cantidadAsociados: [{ value: 0, disabled: true }],
      email: [{ value: '', disabled: !this.isAdmin }],
      telefono: [{ value: '', disabled: true }],
      password: [{ value: '', disabled: !this.isAdmin }],
      isActive: [{ value: false, disabled: !this.isAdmin }]
    });

    // Cargar socio
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.socioId = id;
        const socio = await this.sociosService.getSocioById(id);
        if (socio) {
          this.socio = socio;
          this.socioForm.patchValue({
            nombre: socio.nombre,
            cantidadAsociados: socio.cantidadAsociados,
            email: socio.email,
            telefono: socio.telefono,
            isActive: socio.isActive
          });
          this.cdr.detectChanges();
        }
        this.cargando = false;
      }
    });
  }
  
  onPasswordToggle() {
    this.showPassword = !this.showPassword;
  }

  async guardarCambios() {
    if (!this.isAdmin) return;
    if (this.socioForm.valid) {
      const { email, password, isActive } = this.socioForm.value;

      // Solo incluir password si no está vacío
      const datosActualizar: any = { email, isActive };
      if (password && password.trim() !== '') {
        datosActualizar.password = password;
      }

      await this.sociosService.updateSocio(this.socioId, datosActualizar);
      alert('Cambios guardados correctamente');

      // actualizar objeto local
      if (this.socio) this.socio.isActive = isActive;

      // Limpiar input de password después de guardar
      this.socioForm.get('password')?.reset();
    }
  }


  volver() {
    this.router.navigate(['/socios']);
  }
}