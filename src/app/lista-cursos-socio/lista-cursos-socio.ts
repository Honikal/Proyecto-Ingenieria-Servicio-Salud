import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-curso-socio-list',
  templateUrl: './lista-cursos-socio.html',
  styleUrls: ['./lista-cursos-socio.css'],
  standalone: true,
  imports: [AsyncPipe, CommonModule]
})
export class ListaCursosSocio {
  cursoList$!: Observable<any[]>; 
  cursoMenuOpen: boolean = false;
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

      this.cursoList$ = this.firebaseService.getCursosDeSocio(this.socioActual.id);

      this.cursoList$.subscribe(list => {
        console.log('Cursos del socio:', list);
      });
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
  
  verCurso(id: string) {
    this.router.navigate(['/ver-curso', id]);
  }

  async eliminarCurso(id: string, event?: Event) {
    if (event) event.stopPropagation();
    const confirm = await Swal.fire({
      title: '¿Eliminar curso?',
      text: 'Esta acción eliminará el curso permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await this.firebaseService.deleteCurso(id);
        Swal.fire('Eliminado', 'El curso fue eliminado correctamente.', 'success');
      } catch (error) {
        console.error('Error al eliminar el curso:', error);
        Swal.fire('Error', 'Ocurrió un error al eliminar el curso.', 'error');
      }
    }
  }

}
