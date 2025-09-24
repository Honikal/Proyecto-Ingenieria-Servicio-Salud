import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model'; 
import { CommonModule, NgFor } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lista-socios',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './lista-socios.html',
  styleUrls: ['./lista-socios.css']
})
export class ListaSocios implements OnInit {
  socios$!: Observable<Socio[]>;
  isAdmin = false;

  constructor(private sociosService: SociosService, private router: Router) {}

  ngOnInit(): void {
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
    this.router.navigate(['/']);
  }
}