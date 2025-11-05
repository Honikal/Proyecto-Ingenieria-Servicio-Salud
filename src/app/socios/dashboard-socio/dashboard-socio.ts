import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Socio } from '../../../models/socio.model';

@Component({
  selector: 'app-dashboard-socio',
  templateUrl: './dashboard-socio.html',
  styleUrls: ['./dashboard-socio.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DashboardSocio {
  userMenuOpen: boolean = false;
  socio: Socio | null = null;

  constructor(private router: Router) {
    const storedSocio = localStorage.getItem('currentSocio');
    if (storedSocio) {
      this.socio = JSON.parse(storedSocio);
    }
  }

  toggleMenu(value: boolean) {
    this.userMenuOpen = !this.userMenuOpen;
  }

  onLogoutClick() {
    localStorage.removeItem('currentSocio');
    this.socio = null;
    this.router.navigate(['/']);
  }

  onProfileClick() {
    this.router.navigate(['/perfil-socio']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard-socio']);
  }

  goToCourses() {
    this.router.navigate(['/mis-cursos']);
  }

  goToAsociar() {
    this.router.navigate(['/asociar-miembro']);
  }

  goToCertificates() {
    this.router.navigate(['/certificados']);
  }

  goToSupport() {
    this.router.navigate(['/soporte']);
  }

  getInitials(): string {
    if (!this.socio?.nombre) return '??';
    const parts = this.socio.nombre.split(' ');
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }
}
