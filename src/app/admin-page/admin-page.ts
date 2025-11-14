import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { Curso } from '../../models/curso.model';
import { map } from 'rxjs/operators';
import { FirebaseService } from '../services/firebase';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AdminPage {
  userMenuOpen: boolean = false;
  user: User | null = null;
  cursosActivosTotal: number = 0;
  cursosEstaSemana: number = 0;
  usuariosEstaSemana: number = 0;
  sociosEstaSemana: number = 0;

  constructor(private router: Router, private firebase: FirebaseService, private cd: ChangeDetectorRef) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  ngOnInit() {
    this.cargarCursosActivos();
    this.cargarCursosSemana();
    this.cargarUsuariosSemana();
    this.cargarSociosSemana();
  }

  toggleMenu(value: boolean) {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToUsers(): void {
    this.router.navigate(['/members']);
  }

  goToSocios(): void {
    this.router.navigate(['/socios']);
  }

  goToSociosMembers(): void {
    this.router.navigate(['/sociosMember-list']);
  }

  onLogoutClick() {
    localStorage.removeItem('currentUser');
    this.user = null;
    this.router.navigate(['/']); 
  }

  onManageClick() {
    this.router.navigate(['/users']); 
  }

  getInitials() : string {
    if (!this.user?.fullName) return '??';
    const parts = this.user.fullName.split(' ');
    return parts.slice(0, 2).map((p: string) => p[0].toUpperCase()).join('');
  }

  private cargarCursosActivos() {
    this.firebase.getCursosActivos().subscribe(cursos => {
      this.cursosActivosTotal = cursos.length;
      this.cd.detectChanges();  
    });
  }

  private cargarCursosSemana() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo, 1 = lunes...
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    this.firebase.getCursosActivos().subscribe(cursos => {
      this.cursosEstaSemana = cursos.filter(c => {
        let fechaCreacion: Date;

        if (c.fecha instanceof Date) {
          fechaCreacion = c.fecha; // ya es Date
        } else if ((c.fecha as any)?.toDate) {
          fechaCreacion = (c.fecha as any).toDate(); // Timestamp -> Date
        } else {
          fechaCreacion = new Date(c.fecha); // fallback por si es string
        }

        return fechaCreacion >= lunes && fechaCreacion <= domingo;
      }).length;

      this.cd.detectChanges(); // fuerza actualización en pantalla
    });
  }
  private cargarUsuariosSemana() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo, 1 = lunes...
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    this.firebase.getUsers().subscribe(users => {
      this.usuariosEstaSemana = users.filter(u => {
        let fecha: Date;
        if (u.createdAt instanceof Date) {
          fecha = u.createdAt;
        } else if ((u.createdAt as any)?.toDate) {
          fecha = (u.createdAt as any).toDate();
        } else {
          fecha = new Date(u.createdAt);
        }
        return fecha >= lunes && fecha <= domingo;
      }).length;
      this.cd.detectChanges();
    });
  }
  private cargarSociosSemana() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo, 1 = lunes...
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    this.firebase.getSocios().subscribe(socios => {
      this.sociosEstaSemana = socios.filter(s => {
        let fecha: Date;
        if (s.fecha instanceof Date) {
          fecha = s.fecha;
        } else if ((s.fecha as any)?.toDate) {
          fecha = (s.fecha as any).toDate();
        } else {
          fecha = new Date(s.fecha);
        }
        return fecha >= lunes && fecha <= domingo;
      }).length;
      this.cd.detectChanges();
    });
  }

}
