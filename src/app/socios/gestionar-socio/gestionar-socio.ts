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

      // 1. Validar email ya registrado en otro socio
      if (email !== this.socio?.email) {
        const exists = await this.sociosService.emailExistsForAnotherUser(email, this.socioId);
        if (exists) {
          alert("El correo ingresado ya está registrado por otro socio.");
          return;
        }
      }

      // 2. Validar reglas de contraseña (si fue ingresada)
      if (password && password.trim() !== '') {
        if (password.length < 8) {
          alert("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
      }

      // 3. Crear objeto de actualización
      const datosActualizar: any = {
        email,
        isActive
      };

      if (password && password.trim() !== '') {
        datosActualizar.password = password; // se hashéa en el servicio
      }

      // 4. Actualizar en Firestore
      await this.sociosService.updateSocio(this.socioId, datosActualizar);
      alert('Cambios guardados correctamente');

      // 5. Actualizar socio local
      if (this.socio) {
        this.socio.email = email;
        this.socio.isActive = isActive;
      }

      // 6. Reset password field
      this.socioForm.get('password')?.reset();
    }
  }


  volver() {
    this.router.navigate(['/socios']);
  }

  cursos() {
    this.router.navigate(['/cursos'], { 
      queryParams: { idSocio: this.socioId, from: 'user' }
    });
  }
}