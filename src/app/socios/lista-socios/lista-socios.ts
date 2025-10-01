import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SociosService } from '../../services/socios.service';
import { Socio } from '../../../models/socio.model'; 
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lista-socios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-socios.html',
  styleUrls: ['./lista-socios.css']
})
export class ListaSocios implements OnInit {
  socios$!: Observable<Socio[]>;
  isAdmin = false;

  constructor(private sociosService: SociosService, private router: Router) {}

  ngOnInit(): void {
    this.socios$ = this.sociosService.getSocios();

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      this.isAdmin = user.isAdmin === true;
    }
  }

  verSocio(id?: string) {
    if (!id) return;
    this.router.navigate(['/socios', id]);
  }

  agregarSocio() {
    this.router.navigate(['/socios/registrar']);
  }
  
  volver() {
    this.router.navigate(['/']);
  }
}