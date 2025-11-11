import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-member-list',
  templateUrl: './lista-asociados.html',
  styleUrls: ['./lista-asociados.css'],
  standalone: true,
  imports: [AsyncPipe, CommonModule]
})
export class ListaAsociados {
  userList$!: Observable<any[]>; 
  userMenuOpen: boolean = false;
  socioActual: any | null = null;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    const storedSocio = localStorage.getItem('currentSocio');
    if (storedSocio) {
      this.socioActual = JSON.parse(storedSocio);
      console.log('Socio actual cargado:', this.socioActual);

      this.userList$ = this.firebaseService.getUsersXSocioFull(this.socioActual.id);
    } else {
      console.warn('No se encontró socio actual en localStorage.');
    }
  }

  goBackToDashboard() {
    this.router.navigate(['/socios/dashboard-socio']);
  }

  onLogoutClick() {
    localStorage.removeItem('currentSocio');
    this.socioActual = null;
    this.router.navigate(['/']);
  }

  getInitials(fullName: string): string {
    if (!fullName) return '??';
    const parts = fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }

  async eliminarRelacion(id: string) {
    const confirm = await Swal.fire({
      title: '¿Eliminar asociación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await this.firebaseService.deleteUserXSocio(id);
        Swal.fire('Eliminado', 'La asociación fue eliminada correctamente.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Ocurrió un error al eliminar la asociación.', 'error');
      }
    }
  }

}
