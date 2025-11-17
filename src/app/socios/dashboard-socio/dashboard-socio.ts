import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; 
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
  userMenuOpen = false;
  socio: Socio | null = null;
  idSocio: string | null = null; 

  constructor(
    private router: Router,
    private route: ActivatedRoute 
  ) {
    const storedSocio = localStorage.getItem('currentSocio');
    if (storedSocio) {
      this.socio = JSON.parse(storedSocio);
    }
  }

  ngOnInit() {
    // 🔹 Leer el parámetro desde la URL
    this.route.paramMap.subscribe(params => {
      this.idSocio = params.get('idSocio');
      console.log('ID del socio actual:', this.idSocio);
    });
  }

  toggleMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  onLogoutClick() {
    localStorage.removeItem('currentSocio');
    this.socio = null;
    this.router.navigate(['/']);
  }

  onProfileClick() {
    this.router.navigate(['/users']);
  }

  goToDashboard() {
    if (this.idSocio) {
      this.router.navigate([`/socios/dashboard-socio/${this.idSocio}`]);
    } else {
      this.router.navigate(['/socios/dashboard-socio']);
    }
  }

  goToCourses() {
    if (this.idSocio) {
      this.router.navigate(['/cursos'], { 
        queryParams: { idSocio: this.idSocio, from: 'socio' }
      });
    }
  }

  goToAsociar() {
    if (this.idSocio) {
      this.router.navigate(['/asociar-miembro'], { queryParams: { idSocio: this.idSocio } });
    } else {
      this.router.navigate(['/asociar-miembro']);
    }
  }

  goToAsociados() {
    if (this.idSocio) {
      this.router.navigate(['/lista-asociados'], { queryParams: { idSocio: this.idSocio } });
    } else {
      this.router.navigate(['/lista-asociados']);
    }
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
