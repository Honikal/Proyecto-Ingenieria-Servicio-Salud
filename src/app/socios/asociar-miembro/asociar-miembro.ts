import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asociar-miembro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asociar-miembro.html',
  styleUrls: ['./asociar-miembro.css']
})
export class AsociarMiembro {
  correoUsuario = '';
  socioActual: any = null;
  cargando = false;
  mensaje = '';
  error = false;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    const storedSocio = localStorage.getItem('currentSocio');
    if (storedSocio) {
      this.socioActual = JSON.parse(storedSocio);
      console.log('Socio actual cargado desde localStorage:', this.socioActual);
    } else {
      console.warn('No se encontró socio actual en localStorage.');
    }
  }

  async asociarUsuario() {
    this.mensaje = '';
    this.error = false;

    if (!this.correoUsuario) {
      this.mensaje = 'Por favor ingrese un correo válido.';
      this.error = true;
      return;
    }

    this.cargando = true;

    try {
      const usuario = await this.firebaseService.getUserByEmail(this.correoUsuario);
      if (!usuario) {
        this.mensaje = 'No se encontró ningún usuario con ese correo.';
        this.error = true;
        alert('No se encontró ningún usuario con ese correo.');
        return;
      }

      console.log('Usuario encontrado:', usuario);

      if (!this.socioActual?.email) {
        this.mensaje = 'No se encontró la sesión del socio actual.';
        this.error = true;
        return;
      }

      console.log('Socio confirmado:', this.socioActual.id);

      const nuevaRelacion = {
        idUsuario: usuario.id,
        idSocio: this.socioActual.id
      };

      try {
        await this.firebaseService.addUserXSocio(nuevaRelacion);
        alert('Usuario asociado exitosamente.');
      } catch (error: any) {
        if (error.message.includes('ya está asociado')) {
          alert('El usuario ya está asociado con este socio.');
        } else {
          alert('Ocurrió un error al asociar el usuario.');
        }
      }

      this.mensaje = 'Usuario vinculado exitosamente.';
      this.error = false;
      this.correoUsuario = '';

    } catch (err) {
      console.error('Error al asociar usuario:', err);
      this.mensaje = 'Ocurrió un error al asociar el usuario.';
      this.error = true;
    } finally {
      this.cargando = false;
    }
  }

  cancelar() {
    this.router.navigate(['/socios/dashboard-socio']);
  }
}
