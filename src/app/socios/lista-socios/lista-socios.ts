import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-lista-socios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-socios.html',
  styleUrls: ['./lista-socios.css']
})
export class ListaSocios implements OnInit {
  private sociosSubject = new BehaviorSubject<Socio[]>([]);
  socios$!: Observable<Socio[]>;
  filtroNombre$ = new BehaviorSubject<string>('');
  isAdmin = false;

  constructor(
    private sociosService: SociosService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sociosService.getSocios().subscribe(socios => {
      this.sociosSubject.next(socios);
    });

  this.socios$ = combineLatest([
      this.sociosSubject.asObservable(),
      this.filtroNombre$.asObservable()
    ]).pipe(
      map(([socios, filtro]) => {
        const texto = filtro.toLowerCase();
        return socios.filter(s => s.nombre.toLowerCase().includes(texto));
      })
  );

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      this.isAdmin = user.isAdmin === true;
    }
  }

  actualizarFiltro(texto: string) {
    this.filtroNombre$.next(texto);
    // Verificar si el usuario es admin
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.isAdmin = !!user.isAdmin;
    }

    // Cargar socios como observable
    this.socios$ = this.sociosService.getSocios();
  }

  verSocio(id?: string) {
    if (!id) return;
    this.router.navigate(['/socios', id]);
  }

  agregarSocio() {
    if (!this.isAdmin) return; // Seguridad extra
    this.router.navigate(['/socios/registrar']);
  }
  
  volver() {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/']);
    }
  }

}